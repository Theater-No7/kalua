"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { onAuthStateChanged, User, signOut } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export type UserRole = "OWNER" | "STAFF" | "GUEST"

interface AuthContextType {
    user: User | MockUser | null
    shopId: string | null
    role: UserRole
    loading: boolean
    loginAsDebugUser: (role: UserRole, uid: string) => void
    logout: () => Promise<void>
}

// Mock User structure to mimic Firebase User
interface MockUser {
    uid: string
    displayName: string | null
    email: string | null
    isAnonymous: boolean
    photoURL: string | null
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    shopId: null,
    role: "GUEST", // Default for now
    loading: true,
    loginAsDebugUser: () => { },
    logout: async () => { }
})

export const useAuth = () => useContext(AuthContext)

const DEBUG_STORAGE_KEY = "kalua_debug_auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | MockUser | null>(null)
    const [shopId, setShopId] = useState<string | null>(null)
    const [role, setRole] = useState<UserRole>("GUEST")
    const [loading, setLoading] = useState(true)

    // Initial Load
    useEffect(() => {
        const initAuth = async () => {
            // 1. Check for Debug Session (Dev Only)
            if (process.env.NODE_ENV === 'development') {
                const debugData = localStorage.getItem(DEBUG_STORAGE_KEY)
                if (debugData) {
                    try {
                        const { role, uid } = JSON.parse(debugData)
                        await setActiveDebugUser(role, uid)
                        setLoading(false)
                        return
                    } catch (e) {
                        console.error("Failed to parse debug auth", e)
                        localStorage.removeItem(DEBUG_STORAGE_KEY)
                    }
                }
            }

            // 2. Real Firebase Auth
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser)
                    // Fetch generic user data and shopId
                    // Fetch generic user data and shopId
                    // Note: In real app, "role" might be in custom claims or DB.
                    // For now, if logged in via Firebase, we assume "OWNER" behavior or "STAFF" if anonymous?
                    let finalRole: UserRole = "GUEST"

                    // Default assumption based on auth method
                    if (currentUser.isAnonymous) {
                        finalRole = "STAFF"
                    }

                    try {
                        const userRef = doc(db, "users", currentUser.uid)
                        const userSnap = await getDoc(userRef)

                        if (userSnap.exists()) {
                            const userData = userSnap.data()

                            // Prioritize role from Firestore
                            if (userData.role) {
                                const dbRole = String(userData.role).toUpperCase()
                                if (dbRole === "STAFF" || dbRole === "OWNER") {
                                    finalRole = dbRole as UserRole
                                }
                            }

                            if (userData.shopId) {
                                setShopId(userData.shopId)
                            }
                        } else {
                            // First time user logic
                            // Determine default role if not in DB
                            const defaultRole: UserRole = currentUser.isAnonymous ? "STAFF" : "OWNER"
                            finalRole = defaultRole

                            // Create user in DB with the determined role
                            await setDoc(userRef, {
                                id: currentUser.uid,
                                name: currentUser.displayName || (currentUser.isAnonymous ? "ゲストスタッフ" : "No Name"),
                                photoURL: currentUser.photoURL || null,
                                createdAt: serverTimestamp(),
                                role: finalRole
                            })
                        }
                    } catch (error) {
                        console.error("User DB sync failed:", error)
                    }

                    setRole(finalRole)
                } else {
                    setUser(null)
                    setShopId(null)
                    setRole("GUEST")
                }
                setLoading(false)
            })

            return () => unsubscribe()
        }

        initAuth()
    }, [])

    // --- Mock Logic ---
    const setActiveDebugUser = async (role: UserRole, uid: string) => {
        // Construct Mock User
        const mockUser: MockUser = {
            uid,
            displayName: role === "OWNER" ? "Debug Owner" : "Debug Staff",
            email: `${role.toLowerCase()}@example.com`,
            isAnonymous: false,
            photoURL: null
        }

        setUser(mockUser)
        setRole(role)

        // Fixed Shop ID for debugging
        const DEBUG_SHOP_ID = "debug-shop-001"
        setShopId(DEBUG_SHOP_ID)
    }

    const loginAsDebugUser = (role: UserRole, uid: string) => {
        if (process.env.NODE_ENV !== 'development') return

        const data = { role, uid }
        localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(data))

        // Force state update strictly
        setActiveDebugUser(role, uid)
    }

    const logout = async () => {
        if (process.env.NODE_ENV === 'development') {
            localStorage.removeItem(DEBUG_STORAGE_KEY)
        }
        await signOut(auth)
        setUser(null)
        setShopId(null)
        setRole("GUEST")
    }

    return (
        <AuthContext.Provider value={{ user, shopId, role, loading, loginAsDebugUser, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
