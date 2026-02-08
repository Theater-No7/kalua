"use client"

import React from "react"
import { Coffee, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface RecipeCardGridProps {
    recipes: any[]
    onSelect: (recipe: any) => void
    onToggleVisibility?: (recipe: any) => void
}

export function RecipeCardGrid({ recipes, onSelect, onToggleVisibility }: RecipeCardGridProps) {
    const { user } = useAuth()
    if (recipes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <Coffee className="w-12 h-12 mb-4 text-gray-200" />
                <p>レシピがまだありません</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            {recipes.map((recipe) => {
                const isVisible = recipe.isVisible !== false
                const catName = recipe.displayCategoryName || recipe.category

                return (
                    <div
                        key={recipe.id}
                        onClick={() => onSelect(recipe)}
                        className={`
                            bg-white rounded-xl border border-[#f0f0f0] overflow-hidden 
                            hover:border-[#e0e0e0] transition-all text-left w-full cursor-pointer shadow-sm relative
                            ${!isVisible ? "opacity-90 bg-gray-50" : ""}
                        `}
                    >
                        {/* Status Badge (if hidden) */}
                        {!isVisible && (
                            <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm pointer-events-none">
                                <EyeOff className="w-3 h-3" /> 非公開
                            </div>
                        )}


                        {/* Visibility Toggle Button (Always visible for easy access) */}
                        {onToggleVisibility && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleVisibility(recipe)
                                }}
                                className={`
                                    absolute top-2 right-2 z-20 p-2 rounded-full shadow-sm backdrop-blur-md transition-all
                                    ${isVisible
                                        ? "bg-white/80 text-gray-500 hover:bg-white hover:text-[#0f766e]"
                                        : "bg-gray-900/80 text-white hover:bg-black"}
                                `}
                            >
                                {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                        )}

                        <div className="relative aspect-3/2 bg-[#f8fafc]">
                            {recipe.image ? (
                                <img src={recipe.image} alt={recipe.title} className={`w-full h-full object-cover ${!isVisible ? "grayscale" : ""}`} />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Coffee className="w-8 h-8 text-gray-300" />
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            {/* Title with Unread Badge */}
                            <div className="flex items-start mb-2">
                                <h3 className="font-semibold text-[#333333] text-sm leading-snug line-clamp-2">
                                    {recipe.title}
                                </h3>
                                {user && !recipe.readBy?.includes(user.uid) && (
                                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full ml-2 shrink-0 mt-1" />
                                )}
                            </div>

                            {/* Tags and Category */}
                            <div className="flex flex-wrap gap-1.5 align-middle">
                                {catName && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded text-white bg-[#0f766e]/80 font-medium truncate max-w-[80px]">
                                        {catName}
                                    </span>
                                )}
                                {recipe.tags && recipe.tags.map((tag: string) => (
                                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#666666] font-medium">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
