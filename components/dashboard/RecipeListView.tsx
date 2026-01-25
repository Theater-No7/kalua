"use client"

import React from "react"
import { Coffee, Clock, Eye, EyeOff, CheckSquare, Square } from "lucide-react"

interface RecipeListViewProps {
    recipes: any[] // Using any to accept the extended helper recipe object
    onSelect: (recipe: any) => void
    onToggleVisibility: (recipe: any) => void
    selectedId?: string

    // Selection Props
    selectedRecipeIds: Set<string>
    onSelectOne: (id: string) => void
    onSelectAll: () => void
}

export function RecipeListView({
    recipes,
    onSelect,
    onToggleVisibility,
    selectedId,
    selectedRecipeIds,
    onSelectOne,
    onSelectAll
}: RecipeListViewProps) {
    if (recipes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Coffee className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-medium">No recipes found</p>
            </div>
        )
    }

    const allSelected = recipes.length > 0 && recipes.every(r => selectedRecipeIds.has(r.id))
    const someSelected = recipes.some(r => selectedRecipeIds.has(r.id))

    return (
        <div className="w-full h-full overflow-y-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                        {/* Checkbox Column */}
                        <th className="py-3 pl-4 pr-2 w-10 align-middle hidden md:table-cell">
                            <button
                                onClick={onSelectAll}
                                className="text-gray-400 hover:text-gray-600 transition-colors flex items-center"
                            >
                                {allSelected ? (
                                    <CheckSquare className="w-5 h-5 text-[#0f766e]" />
                                ) : (
                                    <Square className={`w-5 h-5 ${someSelected && !allSelected ? "text-[#0f766e] fill-emerald-100" : ""}`} />
                                )}
                            </button>
                        </th>

                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Category</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 text-center">Visible</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 hidden lg:table-cell">Tags</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 hidden xl:table-cell">Created</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {recipes.map((recipe) => {
                        const isVisible = recipe.isVisible !== false
                        const catName = recipe.displayCategoryName || recipe.category
                        const isSelected = selectedRecipeIds.has(recipe.id)

                        return (
                            <tr
                                key={recipe.id}
                                onClick={() => onSelect(recipe)}
                                className={`
                                    group cursor-pointer transition-colors
                                    ${(selectedId === recipe.id || isSelected) ? "bg-[#0f766e]/5 hover:bg-[#0f766e]/10" : "hover:bg-gray-50"}
                                    ${!isVisible ? "opacity-60 grayscale bg-gray-50/50" : ""}
                                `}
                            >
                                {/* Checkbox Cell */}
                                <td className="py-3 pl-4 pr-2 align-middle hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => onSelectOne(recipe.id)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors flex items-center"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="w-5 h-5 text-[#0f766e]" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </td>

                                <td className="py-3 px-4 align-middle">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                        {recipe.image ? (
                                            <img src={recipe.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Coffee className="w-4 h-4 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 align-middle">
                                    <p className={`font-semibold text-sm ${selectedId === recipe.id ? "text-[#0f766e]" : "text-gray-800"}`}>
                                        {recipe.title}
                                    </p>
                                </td>
                                <td className="py-3 px-4 align-middle">
                                    {catName ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                                            {catName}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="py-3 px-4 align-middle text-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onToggleVisibility(recipe)
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors ${isVisible ? "text-gray-400 hover:text-[#0f766e] hover:bg-[#0f766e]/10" : "text-gray-400 hover:bg-gray-200"}`}
                                    >
                                        {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </td>
                                <td className="py-3 px-4 align-middle hidden lg:table-cell">
                                    <div className="flex gap-1 flex-wrap">
                                        {recipe.tags?.slice(0, 3).map((tag: string) => (
                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#0f766e] font-medium">
                                                #{tag}
                                            </span>
                                        ))}
                                        {recipe.tags?.length > 3 && (
                                            <span className="text-[10px] text-gray-400 self-center">+{recipe.tags.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 align-middle hidden xl:table-cell text-xs text-gray-500 font-mono">
                                    {recipe.createdAt?.seconds ? (
                                        <span className="flex items-center gap-1.5 opacity-60">
                                            <Clock className="w-3 h-3" />
                                            {new Date(recipe.createdAt.seconds * 1000).toLocaleDateString()}
                                        </span>
                                    ) : "-"}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
