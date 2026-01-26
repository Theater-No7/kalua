import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy, getDocs, writeBatch, arrayUnion, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"

export function useNotifications(shopId: string) {
    const { user, role } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!shopId || !user) return

        // Fetch notifications for this shop
        // Logic: 
        // 1. Notifications specific to user (if any) OR global notifications
        // 2. Filter out those "readBy" user

        // Simpler approach for now based on previous implementation plan:
        // Notifications collection has `readBy` array.
        // We just count docs where `readBy` does NOT contain user.uid

        const q = query(
            collection(db, "stores", shopId, "notifications"),
            orderBy("createdAt", "desc"),
            limit(50)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let all = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as any[]

            // Filter for OWNER: Hide 'create' and 'update' notifications (recipe updates)
            // Future-proof: Using filter to allow other types (e.g. 'system') if added later.
            if (role === 'OWNER') {
                all = all.filter(n => n.type !== 'create' && n.type !== 'update')
            }

            const unread = all.filter(n => !n.readBy?.includes(user.uid))
            setUnreadCount(unread.length)
            setNotifications(all)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [shopId, user])

    const markNotificationsAsReadByRecipeId = async (recipeId: string, userId: string): Promise<void> => {
        if (!shopId || !recipeId || !userId) return

        try {
            // Find notifications for this recipe
            const q = query(
                collection(db, "stores", shopId, "notifications"),
                where("recipeId", "==", recipeId)
            )
            const snapshot = await getDocs(q)
            console.log(`Found ${snapshot.size} notifications for recipe ${recipeId}`)

            const batch = writeBatch(db)
            let hasUpdates = false

            snapshot.docs.forEach(doc => {
                const data = doc.data()
                const readBy = data.readBy || []
                if (!readBy.includes(userId)) {
                    batch.update(doc.ref, {
                        readBy: arrayUnion(userId)
                    })
                    hasUpdates = true
                }
            })

            if (hasUpdates) {
                await batch.commit()
            }
        } catch (error) {
            console.error("Error marking notifications as read:", error)
        }
    }

    return {
        unreadCount,
        notifications,
        loading: isLoading,
        markNotificationsAsReadByRecipeId
    }
}
