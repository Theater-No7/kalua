"use client"

import React from "react"
import { X, Coffee } from "lucide-react"
import { RecipeForm } from "../RecipeForm"

interface RecipeSidePanelProps {
    isOpen: boolean
    onClose: () => void
    shopId: string
    editingRecipe?: any
    onSave: () => void
}

export function RecipeSidePanel({ isOpen, onClose, shopId, editingRecipe, onSave }: RecipeSidePanelProps) {
    if (!isOpen) {
        return (
            <div className="hidden md:flex w-0 border-l border-gray-100 bg-white transition-all duration-300 ease-in-out overflow-hidden" />
        )
    }

    return (
        <div className="hidden md:flex flex-col w-[400px] border-l border-gray-100 bg-white h-screen sticky top-0 shadow-xl z-20 transition-all duration-300 ease-in-out">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <Coffee className="w-5 h-5 text-[#0f766e]" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800">
                            {editingRecipe ? "Edit Properties" : "New Recipe"}
                        </h2>
                        <p className="text-xs text-gray-400">
                            {editingRecipe ? "Update recipe details" : "Create a new menu item"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <RecipeForm
                    shopId={shopId}
                    initialData={editingRecipe}
                    onSave={onSave}
                    onCancel={onClose}
                />
            </div>
        </div>
    )
}
