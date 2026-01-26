import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, writeBatch } from "firebase/firestore"

export function useRecipes(shopId: string) {

    const markRecipeAsRead = async (recipeId: string, userId: string) => {
        if (!shopId || !recipeId || !userId) return false

        try {
            const recipeRef = doc(db, "stores", shopId, "recipes", recipeId)
            await updateDoc(recipeRef, {
                readBy: arrayUnion(userId)
            })
            console.log(`Marked recipe ${recipeId} as read by ${userId}`)
            return true
        } catch (error) {
            console.error("Failed to mark recipe as read:", error)
            return false
        }
    }

    const addRecipe = async (data: any, notifyStaff: boolean = false) => {
        if (!shopId) return

        const batch = writeBatch(db)

        // 1. Create Recipe Ref
        const recipesRef = collection(db, "stores", shopId, "recipes")
        const newRecipeRef = doc(recipesRef) // Auto ID

        batch.set(newRecipeRef, {
            ...data,
            readBy: [], // Init empty
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        })

        // 2. Notification (Optional)
        if (notifyStaff) {
            const notifRef = doc(collection(db, "stores", shopId, "notifications"))
            batch.set(notifRef, {
                type: "create",
                recipeId: newRecipeRef.id,
                recipeTitle: data.title,
                message: `New recipe: ${data.title}`,
                createdAt: serverTimestamp(),
                readBy: []
            })
        }

        await batch.commit()
        return newRecipeRef.id
    }

    const updateRecipe = async (recipeId: string, data: any, notifyStaff: boolean = false) => {
        if (!shopId || !recipeId) return

        const batch = writeBatch(db)
        const recipeRef = doc(db, "stores", shopId, "recipes", recipeId)

        // 1. Update Data & Reset Read Status
        const updateData = {
            ...data,
            readBy: [], // RESET READ STATUS
            updatedAt: serverTimestamp()
        }

        batch.update(recipeRef, updateData)

        // 2. Notification (Optional)
        if (notifyStaff) {
            const notifRef = doc(collection(db, "stores", shopId, "notifications"))
            batch.set(notifRef, {
                type: "update",
                recipeId: recipeId,
                recipeTitle: data.title,
                message: `Recipe updated: ${data.title}`,
                createdAt: serverTimestamp(),
                readBy: []
            })
        }

        await batch.commit()
    }

    return {
        markRecipeAsRead,
        addRecipe,
        updateRecipe
    }
}
