"use client"

import React from "react"
import { X } from "lucide-react"
import { RecipeForm } from "./RecipeForm"

interface AddRecipeModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    editingRecipe?: any
    shopId: string
}

export function AddRecipeModal({ isOpen, onClose, onSave, editingRecipe, shopId }: AddRecipeModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">
                        {editingRecipe ? "Edit Recipe" : "New Recipe"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4">
                    <RecipeForm
                        shopId={shopId}
                        initialData={editingRecipe}
                        onSave={onSave}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    )
}