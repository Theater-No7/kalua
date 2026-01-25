import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"

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

    return {
        markRecipeAsRead
    }
}
