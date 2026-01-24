"use client"

import React from "react"
import { Coffee } from "lucide-react"

interface RecipeCardGridProps {
    recipes: any[]
    onSelect: (recipe: any) => void
}

export function RecipeCardGrid({ recipes, onSelect }: RecipeCardGridProps) {
    if (recipes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <Coffee className="w-12 h-12 mb-4 text-gray-200" />
                <p>No recipes yet</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            {recipes.map((recipe) => (
                <div
                    key={recipe.id}
                    onClick={() => onSelect(recipe)}
                    className="bg-white rounded-xl border border-[#f0f0f0] overflow-hidden hover:border-[#e0e0e0] transition-colors text-left w-full cursor-pointer shadow-sm"
                >
                    <div className="relative aspect-[3/2] bg-[#f8fafc]">
                        {recipe.image ? (
                            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Coffee className="w-8 h-8 text-gray-300" />
                            </div>
                        )}
                    </div>
                    <div className="p-3">
                        <h3 className="font-semibold text-[#333333] text-sm leading-snug mb-2 line-clamp-2">
                            {recipe.title}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {recipe.tags && recipe.tags.map((tag: string) => (
                                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#666666] font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
