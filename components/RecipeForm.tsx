"use client"

import React, { useState, useEffect, useRef } from "react"
import { Upload, Plus, Loader2, Trash2, X } from "lucide-react"
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"

interface RecipeFormProps {
    shopId: string
    initialData?: any
    onSave: () => void
    onCancel: () => void
}

export function RecipeForm({ shopId, initialData, onSave, onCancel }: RecipeFormProps) {
    // Categories from Firestore
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])

    // Form States
    const [title, setTitle] = useState("")
    const [category, setCategory] = useState("")
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [ingredients, setIngredients] = useState<string[]>([""])
    const [steps, setSteps] = useState("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

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

            // Auto-select first category for new recipes
            if (!category && !initialData && cats.length > 0) {
                setCategory(cats[0].name)
            }
        })
        return () => unsubscribe()
    }, [shopId, category, initialData])

    // Load Initial Data
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || "")
            setCategory(initialData.category || "")
            setTags(initialData.tags || [])
            setIngredients(initialData.ingredients && initialData.ingredients.length > 0 ? initialData.ingredients : [""])
            setSteps(initialData.steps || "")
            setImagePreview(initialData.image || "")
        } else {
            // Reset for new recipe
            setTitle("")
            if (categories.length > 0) setCategory(categories[0].name)
            setTags([])
            setIngredients([""])
            setSteps("")
            setImageFile(null)
            setImagePreview("")
        }
    }, [initialData]) // Removed categories dependency to avoid loop

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

    const handleSubmit = async () => {
        if (!title) return alert("Please enter a recipe title")

        try {
            setIsSubmitting(true)

            let downloadURL = imagePreview

            if (imageFile) {
                const fileName = `${Date.now()}_${imageFile.name}`
                const storageRef = ref(storage, `images/${fileName}`)
                const snapshot = await uploadBytes(storageRef, imageFile)
                downloadURL = await getDownloadURL(snapshot.ref)
            }

            const cleanIngredients = ingredients.filter(i => i.trim() !== "")

            const recipeData = {
                title,
                category,
                tags,
                image: downloadURL,
                ingredients: cleanIngredients,
                steps,
                updatedAt: serverTimestamp(),
            }

            if (initialData) {
                // Update
                const docRef = doc(db, "stores", shopId, "recipes", initialData.id)
                await updateDoc(docRef, recipeData)
                alert("Recipe updated!")
            } else {
                // Create
                await addDoc(collection(db, "stores", shopId, "recipes"), {
                    ...recipeData,
                    createdAt: serverTimestamp(),
                })
                alert("Recipe saved!")
            }

            onSave()
        } catch (error) {
            console.error("Error saving document: ", error)
            alert("Failed to save")
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

            {/* Category */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.name)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === cat.name
                                    ? "bg-[#0f766e] text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
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

            {/* Tags */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Tags</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="e.g. ICE, Sweet"
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
                <div className="flex flex-wrap gap-2 mt-2">
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
            </div>

            {/* Actions */}
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
        </div>
    )
}
