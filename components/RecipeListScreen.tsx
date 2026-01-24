"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Coffee, Settings } from "lucide-react" // LogOutを削除しSettingsを追加
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AddRecipeModal } from "./AddRecipeModal"
import { RecipeDetailScreen } from "./RecipeDetailScreen"
import { ShopSettingsModal } from "./ShopSettingsModal" // 追加

// レシピの型定義
interface Recipe {
    id: string
    title: string
    category: string
    tags: string[]
    image?: string
    ingredients?: string[]
    steps?: string
    createdAt?: any
}

interface RecipeListScreenProps {
    shopId: string
    onLogout?: () => void
}

export function RecipeListScreen({ shopId, onLogout }: RecipeListScreenProps) {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

    // 設定モーダルの開閉状態
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // 編集中のレシピを入れておくステート
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

    // Firestoreからレシピをリアルタイム取得
    useEffect(() => {
        if (!shopId) return
        const q = query(collection(db, "stores", shopId, "recipes"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recipesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Recipe[]
            setRecipes(recipesData)
        })
        return () => unsubscribe()
    }, [shopId])

    // 検索フィルタリング
    const filteredRecipes = recipes.filter((recipe) => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesCategory = selectedCategory === "All" || recipe.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    // 削除機能
    const handleDeleteRecipe = async (recipeId: string) => {
        if (!window.confirm("本当にこのレシピを削除しますか？\n（元に戻せません）")) return

        try {
            await deleteDoc(doc(db, "stores", shopId, "recipes", recipeId))
            setSelectedRecipe(null) // 詳細画面を閉じる
            alert("削除しました")
        } catch (error) {
            console.error("Error deleting document: ", error)
            alert("削除に失敗しました")
        }
    }

    // 編集開始
    const handleEditRecipe = () => {
        if (selectedRecipe) {
            setEditingRecipe(selectedRecipe) // 編集対象をセット
            setIsModalOpen(true) // モーダルを開く
        }
    }

    // 詳細画面が開いているなら詳細画面を表示
    return (
        <>
            {selectedRecipe ? (
                <RecipeDetailScreen
                    recipe={selectedRecipe}
                    onBack={() => setSelectedRecipe(null)}
                    onEdit={handleEditRecipe}
                    onDelete={() => handleDeleteRecipe(selectedRecipe.id)}
                />
            ) : (
                <div className="flex flex-col h-screen bg-white">
                    {/* Header */}
                    <div className="px-6 pt-12 pb-4 bg-white sticky top-0 z-10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-[#333333]">Recipes</h1>
                                <p className="text-[#999999] text-sm">Welcome back, Barista</p>
                            </div>
                            {/* 設定ボタン（旧ログアウトボタン） */}
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999999] w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search recipes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#f5f5f5] rounded-xl py-3 pl-10 pr-4 text-[#333333] placeholder-[#999999] outline-none focus:ring-2 focus:ring-[#0f766e]/20"
                            />
                        </div>

                        {/* Categories */}
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {["All", "Coffee", "Tea", "Frappe", "Food", "Other"].map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === category
                                        ? "bg-[#0f766e] text-white"
                                        : "bg-white border border-[#e0e0e0] text-[#666666]"
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recipe Grid */}
                    <div className="flex-1 overflow-y-auto px-6 pb-24">
                        <div className="grid grid-cols-2 gap-4">
                            {filteredRecipes.map((recipe) => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onClick={() => setSelectedRecipe(recipe)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Floating Action Button */}
                    <button
                        onClick={() => {
                            setEditingRecipe(null) // 新規作成なので編集対象を空にする
                            setIsModalOpen(true)
                        }}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0f766e] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0d6560] transition-colors z-20"
                    >
                        <Plus className="text-white w-6 h-6" />
                    </button>

                </div>
            )}

            {/* レシピ追加・編集モーダル */}
            <AddRecipeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={() => {
                    setIsModalOpen(false)
                    setEditingRecipe(null)
                    if (editingRecipe) {
                        setSelectedRecipe(null)
                    }
                }}
                editingRecipe={editingRecipe}
                shopId={shopId}
            />

            {/* 設定モーダル（ここに追加！） */}
            <ShopSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                shopId={shopId}
                onLogout={onLogout}
            />
        </>
    )
}

function RecipeCard({ recipe, onClick }: { recipe: Recipe, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-[#f0f0f0] overflow-hidden hover:border-[#e0e0e0] transition-colors text-left w-full cursor-pointer"
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
                    {recipe.tags && recipe.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#666666] font-medium">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}