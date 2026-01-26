"use client"

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Upload, Plus, Loader2, Trash2, X, Eye, EyeOff, Check, Tag, Bell } from "lucide-react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { useRecipes } from "@/hooks/useRecipes"

export interface RecipeFormHandle {
    submit: () => Promise<void>
}

interface RecipeFormProps {
    shopId: string
    initialData?: any
    onSave: () => void
    onCancel: () => void
    hideActions?: boolean
}

const TAG_PRESETS = ["New", "Seasonal", "Limited", "Sold Out", "Recommended", "Hot", "Iced"]

export const RecipeForm = forwardRef<RecipeFormHandle, RecipeFormProps>(({ shopId, initialData, onSave, onCancel, hideActions }, ref) => {
    // Categories from Firestore
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])

    // Form States
    const [title, setTitle] = useState("")
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("") // Single Category ID
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [ingredients, setIngredients] = useState<string[]>([""])
    const [steps, setSteps] = useState("")
    const [isVisible, setIsVisible] = useState(true) // Default true
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Expose submit method
    useImperativeHandle(ref, () => ({
        submit: handleSubmit
    }))

    // Load Categories
    useEffect(() => {
        if (!shopId) return
        const q = query(collection(db, "stores", shopId, "categories"), orderBy("order", "asc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                ...doc.data()
            })) as { id: string, name: string }[]
            setCategories(cats)
        })
        return () => unsubscribe()
    }, [shopId])

    // Load Initial Data
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || "")

            // Resolve Category
            let catId = ""
            if (initialData.categoryId) {
                catId = initialData.categoryId
            } else if (initialData.categoryIds && initialData.categoryIds.length > 0) {
                // Migration: Take first one
                catId = initialData.categoryIds[0]
            } else if (initialData.category) {
                // Legacy Name Fallback (will be resolved when categories load, or handled in separate effect)
            }
            setSelectedCategoryId(catId)

            setTags(initialData.tags || [])
            setIngredients(initialData.ingredients && initialData.ingredients.length > 0 ? initialData.ingredients : [""])
            setSteps(initialData.steps || "")
            setImagePreview(initialData.image || "")
            setIsVisible(initialData.isVisible !== false)
            setNotifyStaff(false) // Default to silent for edits
        } else {
            // Reset
            setTitle("")
            setSelectedCategoryId("")
            setTags([])
            setIngredients([""])
            setSteps("")
            setImageFile(null)
            setImagePreview("")
            setIsVisible(true)
            setNotifyStaff(true) // Default to notify for new
        }
    }, [initialData])

    // Sync Name-to-ID for legacy data if needed
    useEffect(() => {
        if (initialData && categories.length > 0 && !selectedCategoryId) {
            // Try to resolve by name if ID still missing
            if (initialData.category) {
                const found = categories.find(c => c.name === initialData.category)
                if (found) {
                    setSelectedCategoryId(found.id)
                }
            }
        }
    }, [initialData, categories, selectedCategoryId])


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const previewUrl = URL.createObjectURL(file)
            setImagePreview(previewUrl)
        }
    }

    const addIngredientRow = () => setIngredients([...ingredients, ""])

    const handleIngredientChange = (index: number, value: string) => {
        const newIngredients = [...ingredients]
        newIngredients[index] = value
        setIngredients(newIngredients)
    }

    const removeIngredientRow = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index)
        setIngredients(newIngredients)
    }

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput("")
        }
    }

    const handleAddPresetTag = (tag: string) => {
        if (!tags.includes(tag)) {
            setTags([...tags, tag])
        }
    }

    // State
    const [notifyStaff, setNotifyStaff] = useState(true)
    const { addRecipe, updateRecipe } = useRecipes(shopId)

    // ... (Hooks)

    const handleSubmit = async () => {
        if (!title) {
            alert("Please enter a recipe title")
            throw new Error("Validation Error")
        }
        if (!selectedCategoryId) {
            alert("Please select a category")
            throw new Error("Validation Error")
        }

        try {
            setIsSubmitting(true)

            let downloadURL = imagePreview

            if (imageFile) {
                const fileName = `${Date.now()}_${imageFile.name}`
                const imgRef = storageRef(storage, `images/${fileName}`)
                const snapshot = await uploadBytes(imgRef, imageFile)
                downloadURL = await getDownloadURL(snapshot.ref)
            }

            const cleanIngredients = ingredients.filter(i => i.trim() !== "")
            const catName = categories.find(c => c.id === selectedCategoryId)?.name || "Uncategorized";

            const recipeData = {
                title,
                categoryId: selectedCategoryId,
                category: catName,
                tags,
                image: downloadURL,
                ingredients: cleanIngredients,
                steps,
                isVisible,
                // updatedAt is handled in hook
            }

            if (initialData) {
                await updateRecipe(initialData.id, recipeData, notifyStaff)
            } else {
                await addRecipe(recipeData, notifyStaff)
            }

            onSave()
        } catch (error) {
            console.error("Error saving document: ", error)
            alert("Failed to save")
            throw error
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            {/* Image Upload */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden aspect-video relative group"
            >
                {imagePreview ? (
                    <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold">Change Image</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center p-8">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">Upload Photo</span>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            {/* Visibility Switch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isVisible ? "bg-emerald-100 text-[#0f766e]" : "bg-gray-200 text-gray-500"}`}>
                            {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 text-sm">Visibility</h3>
                            <p className="text-xs text-gray-400">{isVisible ? "Visible to everyone" : "Hidden from menu"}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0f766e]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f766e]"></div>
                    </label>
                </div>

                {/* Notification Toggle (New) */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${notifyStaff ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-500"}`}>
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 text-sm">Notify Staff</h3>
                            <p className="text-xs text-gray-400">{notifyStaff ? "Will send alert" : "Silent update"}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifyStaff} onChange={(e) => setNotifyStaff(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Recipe Name</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Iced Caramel Latte"
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none transition-all font-medium"
                />
            </div>

            {/* Category (Single Select) */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                        const isSelected = selectedCategoryId === cat.id
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-bold transition-all border-2
                                    flex items-center gap-2
                                    ${isSelected
                                        ? "bg-[#0f766e] text-white border-[#0f766e] shadow-md"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                    }
                                `}
                            >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                {cat.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Tags</label>

                {/* Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Type tag & enter..."
                        className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none"
                        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    />
                    <button
                        onClick={handleAddTag}
                        className="p-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Selected Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-[#0f766e] text-sm font-medium rounded-full"
                            >
                                #{tag}
                                <button
                                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                                    className="hover:text-red-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Presets */}
                <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Presets
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TAG_PRESETS.map(preset => (
                            <button
                                key={preset}
                                onClick={() => handleAddPresetTag(preset)}
                                className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${tags.includes(preset)
                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-[#0f766e] hover:text-[#0f766e]"
                                    }`}
                                disabled={tags.includes(preset)}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Ingredients</label>
                <div className="space-y-2">
                    {ingredients.map((ingredient, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="text"
                                value={ingredient}
                                onChange={(e) => handleIngredientChange(index, e.target.value)}
                                placeholder="e.g. Espresso 30ml"
                                className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none"
                            />
                            {ingredients.length > 1 && (
                                <button
                                    onClick={() => removeIngredientRow(index)}
                                    className="p-3 text-red-400 hover:bg-red-50 rounded-xl"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addIngredientRow}
                        className="text-sm text-[#0f766e] font-medium hover:underline flex items-center gap-1 pl-1"
                    >
                        <Plus className="w-4 h-4" /> Add Line
                    </button>
                </div>
            </div>

            {/* Steps / Notes */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Steps / Notes</label>
                <textarea
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    placeholder="1. Add ice to the glass..."
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none min-h-[100px]"
                />
            </div>

            {/* Actions (Hidden if hideActions is true) */}
            {!hideActions && (
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-[#0f766e] hover:bg-[#0d6560] text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Recipe"
                        )}
                    </button>
                </div>
            )}
        </div>
    )
})

RecipeForm.displayName = "RecipeForm"
