"use client"

import React, { useState, useEffect } from "react"
import { Coffee, Eye, EyeOff, Loader2 } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface HelperRecipe {
    id: string
    title: string
    category?: string
    displayCategoryName?: string
    image?: string
    isVisible?: boolean
    tags?: string[]
    description?: string
    ingredients?: string[]
    steps?: string
    readBy?: string[]
}

interface RecipeReaderProps {
    recipe: HelperRecipe
    shopId: string
    onClose: () => void
    onUpdate?: () => void // Callback to refresh parent list if needed
}

export function RecipeReader({ recipe, shopId, onClose, onUpdate }: RecipeReaderProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [localIsVisible, setLocalIsVisible] = useState(recipe.isVisible !== false)

    // Handle Sold Out Toggle
    const handleToggleVisibility = async () => {
        setIsUpdating(true)
        const newStatus = !localIsVisible
        try {
            const ref = doc(db, "stores", shopId, "recipes", recipe.id)
            await updateDoc(ref, { isVisible: newStatus })
            setLocalIsVisible(newStatus)
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error("Failed to toggle visibility", error)
            alert("Failed to update status")
        } finally {
            setIsUpdating(false)
        }
    }

    const catName = recipe.displayCategoryName || recipe.category

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header / Actions - Just Close and Sold Out Toggle */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <Coffee className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800 text-sm">Recipe Details</h2>
                        <p className="text-xs text-gray-400">Read Only Mode</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sold Out Toggle for Staff */}
                    <button
                        onClick={handleToggleVisibility}
                        disabled={isUpdating}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${localIsVisible
                            ? "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"
                            }`}
                    >
                        {isUpdating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : localIsVisible ? (
                            <>
                                <Eye className="w-3 h-3" />
                                Available
                            </>
                        ) : (
                            <>
                                <EyeOff className="w-3 h-3" />
                                SOLD OUT
                            </>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 space-y-6">
                {/* Image & Title */}
                <div className="space-y-4">
                    <div className="w-full aspect-video rounded-xl bg-gray-100 overflow-hidden relative border border-gray-100">
                        {recipe.image ? (
                            <img src={recipe.image} alt={recipe.title} className={`w-full h-full object-cover ${!localIsVisible ? "grayscale opacity-80" : ""}`} />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-400">
                                <Coffee className="w-12 h-12 opacity-20" />
                            </div>
                        )}
                        {!localIsVisible && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                <span className="text-white font-bold tracking-widest border-2 border-white px-4 py-2 rounded-lg">SOLD OUT</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <h1 className="text-xl font-bold text-gray-800 leading-tight">{recipe.title}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {catName && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#0f766e]/10 text-[#0f766e]">
                                    {catName}
                                </span>
                            )}
                            {recipe.tags?.map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description */}
                {recipe.description && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed">{recipe.description}</p>
                    </div>
                )}

                {/* Ingredients */}
                <div>
                    <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
                        Ingredients
                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-light">{recipe.ingredients?.length || 0}</span>
                    </h3>
                    <ul className="space-y-2">
                        {recipe.ingredients && recipe.ingredients.length > 0 ? recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                <span className="text-sm text-gray-700">{ing}</span>
                            </li>
                        )) : (
                            <li className="text-xs text-gray-400 italic">No ingredients listed.</li>
                        )}
                    </ul>
                </div>

                {/* Steps */}
                <div>
                    <h3 className="font-bold text-gray-700 mb-3 text-sm">How to Make</h3>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        {recipe.steps ? (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {recipe.steps}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No steps listed.</p>
                        )}
                    </div>
                </div>

                {/* Mark as Understood Section */}
                <div className="mt-8 mb-4">
                    <ReadReceiptButton
                        recipeId={recipe.id}
                        readBy={recipe.readBy || []}
                        shopId={shopId}
                        onUpdate={onUpdate}
                    />
                </div>
            </div>
        </div>
    )
}

import { useAuth } from "@/contexts/AuthContext"
import { useRecipes } from "@/hooks/useRecipes"
import { Check, ThumbsUp } from "lucide-react"

function ReadReceiptButton({ recipeId, readBy, shopId, onUpdate }: { recipeId: string, readBy: string[], shopId: string, onUpdate?: () => void }) {
    const { user } = useAuth()
    const { markRecipeAsRead } = useRecipes(shopId)
    const [isRead, setIsRead] = useState(user ? readBy.includes(user.uid) : false)
    const [loading, setLoading] = useState(false)

    // Sync if props change
    useEffect(() => {
        if (user) {
            setIsRead(readBy.includes(user.uid))
        }
    }, [readBy, user])

    const handleMarkAsRead = async () => {
        if (!user || isRead || loading) return

        setLoading(true)
        const success = await markRecipeAsRead(recipeId, user.uid)
        if (success) {
            setIsRead(true)
            if (onUpdate) onUpdate()

            // Celebration effect could be added here (e.g. confetti)
        }
        setLoading(false)
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
