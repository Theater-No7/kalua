import { useState, useEffect } from "react"
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import { User } from "@/types"

export function useUser() {
    const { user } = useAuth()
    const [userData, setUserData] = useState<User | null>(null)

    useEffect(() => {
        if (!user) {
            setUserData(null)
            return
        }

        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                setUserData(doc.data() as User)
            }
        })

        return () => unsub()
    }, [user])

    const toggleBookmark = async (recipeId: string) => {
        if (!user) return

        const isBookmarked = userData?.bookmarks?.includes(recipeId)
        const userRef = doc(db, "users", user.uid)

        try {
            if (isBookmarked) {
                await updateDoc(userRef, {
                    bookmarks: arrayRemove(recipeId)
                })
            } else {
                await updateDoc(userRef, {
                    bookmarks: arrayUnion(recipeId)
                })
            }
        } catch (error) {
            console.error("Failed to toggle bookmark", error)
        }
    }

    return {
        userData,
        toggleBookmark,
        isBookmarked: (recipeId: string) => userData?.bookmarks?.includes(recipeId) || false
    }
}
