"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Upload, Plus, Loader2, Trash2 } from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"

interface AddRecipeModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    editingRecipe?: any
}

const CATEGORIES = ["Coffee", "Tea", "Frappe", "Food", "Other"]

// 👇 この "export" が超重要です！これがないとエラーになります
export function AddRecipeModal({ isOpen, onClose, onSave, editingRecipe }: AddRecipeModalProps) {
    const [title, setTitle] = useState("")
    const [category, setCategory] = useState(CATEGORIES[0])
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")

    // 材料リストと手順
    const [ingredients, setIngredients] = useState<string[]>([""])
    const [steps, setSteps] = useState("")

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setTitle("")
            setCategory(CATEGORIES[0])
            setTags([])
            setTagInput("")
            setIngredients([""])
            setSteps("")
            setImageFile(null)
            setImagePreview("")
            setIsSubmitting(false)
        }
    }, [isOpen])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const previewUrl = URL.createObjectURL(file)
            setImagePreview(previewUrl)
        }
    }

    const addIngredientRow = () => {
        setIngredients([...ingredients, ""])
    }

    const handleIngredientChange = (index: number, value: string) => {
        const newIngredients = [...ingredients]
        newIngredients[index] = value
        setIngredients(newIngredients)
    }

    const removeIngredientRow = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index)
        setIngredients(newIngredients)
    }

    const handleSave = async () => {
        if (!title) return alert("レシピ名を入力してください")

        try {
            setIsSubmitting(true)

            let downloadURL = null

            if (imageFile) {
                const fileName = `${Date.now()}_${imageFile.name}`
                const storageRef = ref(storage, `images/${fileName}`)
                const snapshot = await uploadBytes(storageRef, imageFile)
                downloadURL = await getDownloadURL(snapshot.ref)
            }

            const cleanIngredients = ingredients.filter(i => i.trim() !== "")

            await addDoc(collection(db, "stores", "my-shop", "recipes"), {
                title: title,
                category: category,
                tags: tags,
                image: downloadURL,
                ingredients: cleanIngredients,
                steps: steps,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })

            alert("レシピを保存しました！")
            onSave()
        } catch (error) {
            console.error("Error adding document: ", error)
            alert("保存に失敗しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput("")
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">新しいレシピ</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* 画像 */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden aspect-video relative group"
                    >
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold">変更する</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center p-8">
                                <Upload className="w-8 h-8 mb-2" />
                                <span className="text-sm font-medium">写真をアップロード</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>

                    {/* 基本情報 */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">レシピ名</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="例: アイスキャラメルラテ"
                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">カテゴリ</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === cat
                                            ? "bg-[#0f766e] text-white shadow-md"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 材料リスト */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">材料</label>
                        <div className="space-y-2">
                            {ingredients.map((ingredient, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={ingredient}
                                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                                        placeholder="例: エスプレッソ 30ml"
                                        className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none"
                                    />
                                    {ingredients.length > 1 && (
                                        <button onClick={() => removeIngredientRow(index)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={addIngredientRow} className="text-sm text-[#0f766e] font-medium hover:underline flex items-center gap-1 pl-1">
                                <Plus className="w-4 h-4" /> 行を追加
                            </button>
                        </div>
                    </div>

                    {/* 手順 */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">手順・メモ</label>
                        <textarea
                            value={steps}
                            onChange={(e) => setSteps(e.target.value)}
                            placeholder="1. グラスに氷を入れる&#13;&#10;2. ミルクを注ぐ..."
                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none min-h-[100px]"
                        />
                    </div>

                    {/* タグ */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">タグ</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="例: ICE, 甘め"
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
                                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-[#0f766e] text-sm font-medium rounded-full">
                                    #{tag}
                                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-[#0f766e] hover:bg-[#0d6560] text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                保存中...
                            </>
                        ) : (
                            "レシピを保存"
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}