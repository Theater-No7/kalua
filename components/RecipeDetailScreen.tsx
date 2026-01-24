"use client"

import React, { useState } from "react"
import { ArrowLeft, Clock, Flame, ChefHat, CheckCircle2, Circle, Edit2, Heart, Trash2 } from "lucide-react"

// 受け取るデータの形を定義
interface Recipe {
    id: string
    title: string
    category: string
    tags: string[]
    image?: string | null
    ingredients?: string[] // 追加
    steps?: string         // 追加
    isFavorite?: boolean
}

interface RecipeDetailScreenProps {
    recipe: Recipe
    onBack: () => void
    onEdit: () => void
    onDelete: () => void
}

export function RecipeDetailScreen({ recipe, onBack, onEdit, onDelete }: RecipeDetailScreenProps) {
    // 材料のチェック状態を管理（作ってる最中のメモ用）
    const [checkedIngredients, setCheckedIngredients] = useState<number[]>([])

    const toggleIngredient = (index: number) => {
        if (checkedIngredients.includes(index)) {
            setCheckedIngredients(checkedIngredients.filter((i) => i !== index))
        } else {
            setCheckedIngredients([...checkedIngredients, index])
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* ヘッダー画像エリア */}
            <div className="relative h-72 bg-gray-100">
                {recipe.image ? (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <span className="text-sm">No Image</span>
                    </div>
                )}

                {/* 戻るボタン（左上） */}
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                {/* 操作ボタンエリア（右上） */}
                <div className="absolute top-4 right-4 flex gap-3 z-10">
                    {/* 削除ボタン */}
                    <button
                        onClick={onDelete}
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

                    {/* 編集ボタン */}
                    <button
                        onClick={onEdit}
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 hover:bg-white transition-colors shadow-sm"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 詳細コンテンツ */}
            <div className="flex-1 -mt-6 relative z-10 bg-white rounded-t-3xl px-6 py-8 shadow-lg">
                {/* タイトルとタグ */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-3 gap-4">
                        <h1 className="text-2xl font-bold text-gray-800 leading-tight">{recipe.title}</h1>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <Heart className={`w-6 h-6 ${recipe.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-[#0f766e]/10 text-[#0f766e] text-xs font-bold uppercase tracking-wider">
                            {recipe.category}
                        </span>
                        {recipe.tags && recipe.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 簡易情報バー（今はダミーですが、将来データがあれば表示できます） */}
                <div className="flex items-center justify-between py-4 border-y border-gray-100 mb-8">
                    <div className="flex flex-col items-center flex-1 border-r border-gray-100">
                        <Clock className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs font-medium text-gray-500">3 mins</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 border-r border-gray-100">
                        <Flame className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs font-medium text-gray-500">145 kcal</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <ChefHat className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs font-medium text-gray-500">Easy</span>
                    </div>
                </div>

                {/* 🌟 材料リスト */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        Ingredients
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {recipe.ingredients?.length || 0} items
                        </span>
                    </h2>

                    <div className="space-y-3">
                        {recipe.ingredients && recipe.ingredients.length > 0 ? (
                            recipe.ingredients.map((ingredient, index) => {
                                const isChecked = checkedIngredients.includes(index)
                                return (
                                    <button
                                        key={index}
                                        onClick={() => toggleIngredient(index)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isChecked
                                            ? "bg-emerald-50 border-emerald-100"
                                            : "bg-white border-gray-100 hover:border-gray-200"
                                            }`}
                                    >
                                        {isChecked ? (
                                            <CheckCircle2 className="w-5 h-5 text-[#0f766e] shrink-0" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                                        )}
                                        <span className={`text-sm font-medium ${isChecked ? "text-[#0f766e] line-through decoration-emerald-200" : "text-gray-700"}`}>
                                            {ingredient}
                                        </span>
                                    </button>
                                )
                            })
                        ) : (
                            <p className="text-gray-400 text-sm italic">材料の登録がありません</p>
                        )}
                    </div>
                </div>

                {/* 🌟 手順 */}
                <div className="mb-24">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">How to make</h2>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        {recipe.steps ? (
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {recipe.steps}
                            </p>
                        ) : (
                            <p className="text-gray-400 text-sm italic">手順の登録がありません</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 固定フッター（作成開始ボタン） */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20">
                <button
                    onClick={onBack}
                    className="w-full bg-[#0f766e] hover:bg-[#0d6560] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    作成完了！ (Complete)
                </button>
            </div>
        </div>
    )
}