"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRecipes } from "@/hooks/useRecipes"
import { useNotifications } from "@/hooks/useNotifications"
import { Check, ThumbsUp, Loader2 } from "lucide-react"

interface ReadReceiptButtonProps {
    recipeId: string
    readBy: string[]
    shopId: string
    onUpdate?: () => void
}

export function ReadReceiptButton({ recipeId, readBy, shopId, onUpdate }: ReadReceiptButtonProps) {
    const { user } = useAuth()
    const { markRecipeAsRead } = useRecipes(shopId)
    const { markNotificationsAsReadByRecipeId } = useNotifications(shopId)
    const [isRead, setIsRead] = useState(user ? readBy?.includes(user.uid) : false)
    const [loading, setLoading] = useState(false)

    // Sync if props change
    useEffect(() => {
        if (user) {
            setIsRead(readBy?.includes(user.uid) || false)
        }
    }, [readBy, user])

    const handleMarkAsRead = async () => {
        if (!user || isRead || loading) return

        setLoading(true)
        try {
            // Parallel execution: Mark Recipe Read AND Mark Notifications Read
            await Promise.all([
                markRecipeAsRead(recipeId, user.uid),
                markNotificationsAsReadByRecipeId(recipeId, user.uid)
            ])

            // Assume success if no error thrown
            setIsRead(true)
            if (onUpdate) onUpdate()

        } catch (error) {
            console.error("Failed to mark as read:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
            {!isRead ? (
                <>
                    <p className="text-sm text-gray-600 mb-3 font-medium">手順を理解しましたか？</p>
                    <button
                        onClick={handleMarkAsRead}
                        disabled={loading}
                        className="group relative overflow-hidden bg-[#0f766e] hover:bg-[#0d6560] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed w-full max-w-xs flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <ThumbsUp className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                                理解しました！ (Mark as Understood)
                            </>
                        )}
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-2">
                        クリックするとオーナーに既読通知が送られます
                    </p>
                </>
            ) : (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
                        <Check className="w-6 h-6" />
                    </div>
                    <span className="text-green-700 font-bold">学習済み (Understood ✓)</span>
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date().toLocaleDateString()} に確認済み
                    </p>
                </div>
            )}
        </div>
    )
}
