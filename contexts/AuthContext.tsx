"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { onAuthStateChanged, User, signOut } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export type UserRole = "OWNER" | "STAFF"

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
    role: "OWNER", // Default for now
    loading: true,
    loginAsDebugUser: () => { },
    logout: async () => { }
})

export const useAuth = () => useContext(AuthContext)

const DEBUG_STORAGE_KEY = "kalua_debug_auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | MockUser | null>(null)
    const [shopId, setShopId] = useState<string | null>(null)
    const [role, setRole] = useState<UserRole>("OWNER")
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
                    if (currentUser.isAnonymous) {
                        setRole("STAFF")
                    } else {
                        setRole("OWNER")
                    }

                    try {
                        const userRef = doc(db, "users", currentUser.uid)
                        const userSnap = await getDoc(userRef)

                        if (userSnap.exists()) {
                            const userData = userSnap.data()
                            if (userData.shopId) {
                                setShopId(userData.shopId)
                            }
                        } else {
                            // First time user logic (moved from page.tsx)
                            await setDoc(userRef, {
                                id: currentUser.uid,
                                name: currentUser.displayName || (currentUser.isAnonymous ? "ゲストスタッフ" : "No Name"),
                                photoURL: currentUser.photoURL || null,
                                createdAt: serverTimestamp(),
                            })
                        }
                    } catch (error) {
                        console.error("User DB sync failed:", error)
                    }
                } else {
                    setUser(null)
                    setShopId(null)
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

        // Ensure this mock shop/user exists in Firestore for reads to work?
        // Actually, we might need to ensure the shop doc exists or code will fail on reads.
        // For 'dev', we assume data exists or we create it lazily?
        // For now, let's just set the ID. 
    }

    const loginAsDebugUser = (role: UserRole, uid: string) => {
        if (process.env.NODE_ENV !== 'development') return

        const data = { role, uid }
        localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(data))

        // Force state update strictly
        setActiveDebugUser(role, uid)

        // Reload to ensure clean state? 
        // window.location.reload() // Optional, but hot-reloading context is better UX
    }

    const logout = async () => {
        if (process.env.NODE_ENV === 'development') {
            localStorage.removeItem(DEBUG_STORAGE_KEY)
        }
        await signOut(auth)
        setUser(null)
        setShopId(null)
        setRole("OWNER") // Default reset
    }

    return (
        <AuthContext.Provider value={{ user, shopId, role, loading, loginAsDebugUser, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
