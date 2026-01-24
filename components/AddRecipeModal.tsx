"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Upload, Plus, Loader2, Trash2 } from "lucide-react"
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore" // updateDoc, doc を追加
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"

interface AddRecipeModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    editingRecipe?: any
    shopId: string // shopIdを追加
}

const CATEGORIES = ["Coffee", "Tea", "Frappe", "Food", "Other"]

export function AddRecipeModal({ isOpen, onClose, onSave, editingRecipe, shopId }: AddRecipeModalProps) {
    const [title, setTitle] = useState("")
    const [category, setCategory] = useState(CATEGORIES[0])
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [ingredients, setIngredients] = useState<string[]>([""])
    const [steps, setSteps] = useState("")

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 🌟 修正: 開いた時に「新規」か「編集」かで初期値を切り替える
    useEffect(() => {
        if (isOpen) {
            if (editingRecipe) {
                // 編集モード: 既存のデータを入れる
                setTitle(editingRecipe.title || "")
                setCategory(editingRecipe.category || CATEGORIES[0])
                setTags(editingRecipe.tags || [])
                setIngredients(editingRecipe.ingredients && editingRecipe.ingredients.length > 0 ? editingRecipe.ingredients : [""])
                setSteps(editingRecipe.steps || "")
                setImagePreview(editingRecipe.image || "")
            } else {
                // 新規モード: 全部リセット
                setTitle("")
                setCategory(CATEGORIES[0])
                setTags([])
                setTagInput("")
                setIngredients([""])
                setSteps("")
                setImageFile(null)
                setImagePreview("")
            }
            setIsSubmitting(false)
        }
    }, [isOpen, editingRecipe])

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

    const handleSave = async () => {
        if (!title) return alert("レシピ名を入力してください")

        try {
            setIsSubmitting(true)

            let downloadURL = imagePreview // デフォルトは今の画像URL

            // 新しい画像が選ばれていればアップロード
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

            if (editingRecipe) {
                // 🌟 編集モード: 上書き保存 (updateDoc)
                const docRef = doc(db, "stores", shopId, "recipes", editingRecipe.id)
                await updateDoc(docRef, recipeData)
                alert("レシピを更新しました！")
            } else {
                // 🌟 新規モード: 新規作成 (addDoc)
                await addDoc(collection(db, "stores", shopId, "recipes"), {
                    ...recipeData,
                    createdAt: serverTimestamp(),
                })
                alert("レシピを保存しました！")
            }

            onSave()
        } catch (error) {
            console.error("Error saving document: ", error)
            alert("保存に失敗しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-100">
                    {/* タイトルも切り替える */}
                    <h2 className="text-lg font-bold text-gray-800">
                        {editingRecipe ? "レシピを編集" : "新しいレシピ"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-6">
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
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">レシピ名</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: アイスキャラメルラテ" className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none transition-all font-medium" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">カテゴリ</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === cat ? "bg-[#0f766e] text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{cat}</button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">材料</label>
                        <div className="space-y-2">
                            {ingredients.map((ingredient, index) => (
                                <div key={index} className="flex gap-2">
                                    <input type="text" value={ingredient} onChange={(e) => handleIngredientChange(index, e.target.value)} placeholder="例: エスプレッソ 30ml" className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none" />
                                    {ingredients.length > 1 && (
                                        <button onClick={() => removeIngredientRow(index)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                                    )}
                                </div>
                            ))}
                            <button onClick={addIngredientRow} className="text-sm text-[#0f766e] font-medium hover:underline flex items-center gap-1 pl-1"><Plus className="w-4 h-4" /> 行を追加</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">手順・メモ</label>
                        <textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="1. グラスに氷を入れる..." className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none min-h-[100px]" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">タグ</label>
                        <div className="flex gap-2">
                            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="例: ICE, 甘め" className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none" onKeyDown={(e) => e.key === "Enter" && handleAddTag()} />
                            <button onClick={handleAddTag} className="p-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900"><Plus className="w-5 h-5" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-[#0f766e] text-sm font-medium rounded-full">
                                    #{tag}
                                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors">キャンセル</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-3 bg-[#0f766e] hover:bg-[#0d6560] text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                        {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />保存中...</> : "レシピを保存"}
                    </button>
                </div>
            </div>
        </div>
    )
}