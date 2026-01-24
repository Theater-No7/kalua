"use client"

import React from "react"
import { Coffee, Clock } from "lucide-react"

interface RecipeListViewProps {
    recipes: any[]
    onSelect: (recipe: any) => void
    selectedId?: string
}

export function RecipeListView({ recipes, onSelect, selectedId }: RecipeListViewProps) {
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

    return (
        <div className="w-full h-full overflow-y-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Category</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 hidden lg:table-cell">Tags</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 hidden xl:table-cell">Created</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {recipes.map((recipe) => (
                        <tr
                            key={recipe.id}
                            onClick={() => onSelect(recipe)}
                            className={`
                                group cursor-pointer transition-colors
                                ${selectedId === recipe.id ? "bg-[#0f766e]/5 hover:bg-[#0f766e]/10" : "hover:bg-gray-50"}
                            `}
                        >
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
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    {recipe.category}
                                </span>
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
                    ))}
                </tbody>
            </table>
        </div>
    )
}
