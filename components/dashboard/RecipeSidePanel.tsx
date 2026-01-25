"use client"

import React, { useRef, useState } from "react"
import { X, Coffee, Loader2, Save } from "lucide-react"
import { RecipeReader } from "./RecipeReader"
import { RecipeForm, RecipeFormHandle } from "../RecipeForm"

interface RecipeSidePanelProps {
    isOpen: boolean
    onClose: () => void
    shopId: string
    editingRecipe?: any
    onSave: () => void
    isReadOnly?: boolean
}

export function RecipeSidePanel({ isOpen, onClose, shopId, editingRecipe, onSave, isReadOnly = false }: RecipeSidePanelProps) {
    const formRef = useRef<RecipeFormHandle>(null)
    const [isSaving, setIsSaving] = useState(false)

    if (!isOpen) {
        return (
            <div className="hidden md:flex w-0 border-l border-gray-100 bg-white transition-all duration-300 ease-in-out overflow-hidden" />
        )
    }

    const handlePanelSave = async () => {
        setIsSaving(true)
        try {
            if (formRef.current) {
                await formRef.current.submit()
            }
        } catch (e) {
            // Error handled in RecipeForm
        } finally {
            setIsSaving(false)
        }
    }

    if (isReadOnly && editingRecipe) {
        return (
            <div className="hidden md:flex flex-col w-[400px] border-l border-gray-100 bg-white h-full sticky top-0 shadow-xl z-20 transition-all duration-300 ease-in-out">
                <RecipeReader
                    recipe={editingRecipe}
                    shopId={shopId}
                    onClose={onClose}
                    onUpdate={onSave} // Trigger refresh on sold out toggle
                />
            </div>
        )
    }

    return (
        <div className="hidden md:flex flex-col w-[400px] border-l border-gray-100 bg-white h-full sticky top-0 shadow-xl z-20 transition-all duration-300 ease-in-out">
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
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
                <RecipeForm
                    ref={formRef}
                    shopId={shopId}
                    initialData={editingRecipe}
                    onSave={onSave}
                    onCancel={onClose}
                    hideActions={true} // Hide internal buttons
                />
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/80 backdrop-blur shrink-0 grid grid-cols-2 gap-3">
                <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="py-3 px-4 rounded-xl font-bold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handlePanelSave}
                    disabled={isSaving}
                    className="py-3 px-4 rounded-xl font-bold text-white bg-[#0f766e] hover:bg-[#0d6560] shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
