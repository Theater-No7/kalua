"use client"

import React, { useState, useEffect } from "react"
import {
    Menu,
    Search,
    User,
    Heart,
    BookOpen,
    Brain,
    UserCircle,
    LogOut,
    Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RecipeDetailScreen } from "./RecipeDetailScreen"
import { AddRecipeModal } from "./AddRecipeModal"
// Firestoreの機能をインポート
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface RecipeListScreenProps {
    onLogout: () => void
}

const categories = [
    { id: "all", label: "ALL" },
    { id: "Coffee", label: "Coffee" }, // DBの保存名に合わせて大文字に修正
    { id: "Tea", label: "Tea" },
    { id: "Frappe", label: "Frappe" },
    { id: "Food", label: "Food" },
]

// レシピの型定義（DBの形に合わせる）
type Recipe = {
    id: string
    title: string
    category: string
    tags: string[]
    image?: string | null
    isFavorite?: boolean // とりあえず画面用
}

export function RecipeListScreen({ onLogout }: RecipeListScreenProps) {
    // レシピを管理する箱（最初は空っぽ）
    const [recipes, setRecipes] = useState<Recipe[]>([])

    const [activeCategory, setActiveCategory] = useState("all")
    const [favorites, setFavorites] = useState<string[]>([]) // IDはstringになるので修正
    const [activeTab, setActiveTab] = useState("recipes")
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

    // 🌟 ここが魔法のコード！DBをリアルタイム監視
    useEffect(() => {
        // "stores/my-shop/recipes" を "作成日順" で監視する設定
        const q = query(
            collection(db, "stores", "my-shop", "recipes"),
            orderBy("createdAt", "desc")
        )

        // 監視スタート！データが変わるたびにここが動く
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recipeData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Recipe[]

            setRecipes(recipeData)
        })

        // 画面を閉じる時に監視を終了する（メモリ節約）
        return () => unsubscribe()
    }, [])

    const toggleFavorite = (id: string) => {
        setFavorites((prev) =>
            prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
        )
    }

    const handleRecipeClick = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
    }

    const handleBackFromDetail = () => {
        setSelectedRecipe(null)
    }

    const handleEditFromDetail = () => {
        setEditingRecipe(selectedRecipe)
        setIsAddModalOpen(true)
    }

    const handleOpenAddModal = () => {
        setEditingRecipe(null)
        setIsAddModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsAddModalOpen(false)
        setEditingRecipe(null)
    }

    const handleSaveRecipe = () => {
        // 保存処理はModal内で完結しているので、ここでは閉じるだけ
        // リアルタイム監視しているので、リロードしなくても勝手にリストが増えます！
        setIsAddModalOpen(false)
        setEditingRecipe(null)
    }

    // カテゴリでフィルタリング
    const filteredRecipes = recipes.filter(recipe => {
        if (activeCategory === "all") return true
        return recipe.category === activeCategory
    })

    if (selectedRecipe) {
        return (
            <RecipeDetailScreen
                recipe={selectedRecipe}
                onBack={handleBackFromDetail}
                onEdit={handleEditFromDetail}
            />
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-[#f0f0f0] px-4 py-3">
                <div className="flex items-center justify-between">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#333333] hover:bg-[#f5f5f5] h-10 w-10"
                            >
                                <Menu className="w-5 h-5" strokeWidth={2} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem>
                                <BookOpen className="w-4 h-4 mr-2" />
                                レシピ一覧
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Brain className="w-4 h-4 mr-2" />
                                ドリル
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Heart className="w-4 h-4 mr-2" />
                                お気に入り
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                ログアウト
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <h1 className="text-base font-semibold text-[#333333]">
                        Kalua 渋谷店
                    </h1>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#333333] hover:bg-[#f5f5f5] h-10 w-10"
                            >
                                <User className="w-5 h-5" strokeWidth={2} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>
                                <UserCircle className="w-4 h-4 mr-2" />
                                マイページ
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                ログアウト
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Search & Filter */}
            <div className="sticky top-[57px] z-40 bg-white px-4 py-4 border-b border-[#f0f0f0]">
                <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                    <Input
                        type="text"
                        placeholder="レシピを検索..."
                        className="pl-10 h-11 rounded-lg bg-[#f8fafc] border-0 text-[#333333] placeholder:text-[#999999] focus-visible:ring-1 focus-visible:ring-[#0f766e]"
                    />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-lg ${activeCategory === category.id
                                ? "text-[#0f766e] bg-[#0f766e]/10"
                                : "text-[#666666] hover:text-[#333333] hover:bg-[#f5f5f5]"
                                }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recipe Grid */}
            <main className="flex-1 p-4 pb-24">
                {/* レシピがない場合の表示 */}
                {filteredRecipes.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        レシピがまだありません。<br />
                        右下の＋ボタンから追加してください。
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredRecipes.map((recipe) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                isFavorite={favorites.includes(recipe.id)}
                                onToggleFavorite={() => toggleFavorite(recipe.id)}
                                onClick={() => handleRecipeClick(recipe)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Action Button */}
            <button
                onClick={handleOpenAddModal}
                className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[#0f766e] hover:bg-[#0d6560] text-white shadow-lg flex items-center justify-center transition-colors z-40"
            >
                <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-[#f0f0f0]">
                <div className="flex items-center justify-around py-2 px-4">
                    <NavItem
                        icon={BookOpen}
                        label="Recipes"
                        isActive={activeTab === "recipes"}
                        onClick={() => setActiveTab("recipes")}
                    />
                    <NavItem
                        icon={Brain}
                        label="Drill"
                        isActive={activeTab === "drill"}
                        onClick={() => setActiveTab("drill")}
                    />
                    <NavItem
                        icon={UserCircle}
                        label="My Page"
                        isActive={activeTab === "mypage"}
                        onClick={() => setActiveTab("mypage")}
                    />
                </div>
                <div className="h-[env(safe-area-inset-bottom)]" />
            </nav>

            <AddRecipeModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveRecipe}
                editingRecipe={editingRecipe}
            />
        </div>
    )
}

interface RecipeCardProps {
    recipe: Recipe
    isFavorite: boolean
    onToggleFavorite: () => void
    onClick: () => void
}

// components/RecipeListScreen.tsx の一番下にある関数です

function RecipeCard({ recipe, isFavorite, onToggleFavorite, onClick }: RecipeCardProps) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-[#f0f0f0] overflow-hidden hover:border-[#e0e0e0] transition-colors text-left w-full cursor-pointer"
        >
            {/* Image Area */}
            <div className="relative aspect-[3/2] bg-[#f8fafc]">
                {/* 🌟 修正ポイント: 画像があれば表示、なければ灰色の箱 */}
                {recipe.image ? (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-14 rounded-md bg-[#e8e8e8]" />
                    </div>
                )}

                {/* お気に入りボタン（ここはそのまま） */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite()
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                    <Heart
                        className={`w-4 h-4 transition-colors ${isFavorite ? "fill-[#ef4444] text-[#ef4444]" : "text-[#999999]"
                            }`}
                    />
                </button>
            </div>

            {/* Content (そのまま) */}
            <div className="p-3">
                <h3 className="font-semibold text-[#333333] text-sm leading-snug mb-2 line-clamp-2">
                    {recipe.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {recipe.tags && recipe.tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#666666] font-medium"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

interface NavItemProps {
    icon: React.ComponentType<{ className?: string }>
    label: string
    isActive: boolean
    onClick: () => void
}

function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-lg transition-colors ${isActive
                ? "text-[#0f766e]"
                : "text-[#999999] hover:text-[#666666]"
                }`}
        >
            <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
        </button>
    )
}