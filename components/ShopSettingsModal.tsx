"use client"

import React, { useState, useEffect } from "react"
import { X, Copy, Check, Store, LogOut, Users, UserCircle2, Crown, Grid } from "lucide-react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore" // Firestore機能を追加
import { db } from "@/lib/firebase"
import { CategorySettingsScreen } from "./CategorySettingsScreen" // 追加

interface ShopSettingsModalProps {
    isOpen: boolean
    onClose: () => void
    shopId: string
    onLogout?: () => void
}

// メンバーの型定義
interface Member {
    id: string
    name: string
    role?: "owner" | "staff"
    photoURL?: string
}

export function ShopSettingsModal({ isOpen, onClose, shopId, onLogout }: ShopSettingsModalProps) {
    const [copied, setCopied] = useState(false)
    const [members, setMembers] = useState<Member[]>([]) // メンバー一覧
    const [loading, setLoading] = useState(false)
    const [currentView, setCurrentView] = useState<"settings" | "categories">("settings") // 画面切り替えステート

    // モーダルが開いた時にメンバーを取得 & ビューをリセット
    useEffect(() => {
        if (isOpen && shopId) {
            fetchMembers()
            setCurrentView("settings") // 毎回リセット
        }
    }, [isOpen, shopId])

    const fetchMembers = async () => {
        setLoading(true)
        try {
            // usersコレクションから、shopIdが一致する人を探す
            const q = query(
                collection(db, "users"),
                where("shopId", "==", shopId)
            )
            const querySnapshot = await getDocs(q)
            const membersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Member[]

            // オーナーを先頭に並び替え（簡易的）
            membersData.sort((a, b) => (a.role === 'owner' ? -1 : 1))

            setMembers(membersData)
        } catch (error) {
            console.error("Failed to fetch members:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCopyId = () => {
        navigator.clipboard.writeText(shopId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isOpen) return null

    // カテゴリ編集画面
    if (currentView === "categories") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden max-h-[85vh] h-full flex flex-col">
                    <CategorySettingsScreen
                        shopId={shopId}
                        onBack={() => setCurrentView("settings")}
                    />
                </div>
            </div>
        )
    }

    // 通常設定画面
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
                {/* ヘッダー */}
                <div className="bg-[#0f766e] p-6 text-white text-center relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Shop Settings</h2>
                    <p className="text-emerald-100 text-sm">店舗情報の確認</p>
                </div>

                {/* コンテンツ（スクロール可能に） */}
                <div className="p-6 space-y-6 overflow-y-auto">

                    {/* カテゴリ管理ボタン (New!) */}
                    <button
                        onClick={() => setCurrentView("categories")}
                        className="w-full py-4 text-[#0f766e] font-bold bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-2 border border-emerald-100"
                    >
                        <Grid className="w-5 h-5" />
                        Edit Categories
                    </button>

                    <hr className="border-gray-100" />

                    {/* 招待コード */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Staff Invite Code
                        </label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-gray-100 p-3 rounded-xl text-gray-700 font-mono text-sm border border-gray-200 truncate">
                                {shopId}
                            </code>
                            <button
                                onClick={handleCopyId}
                                className={`p-3 rounded-xl transition-all ${copied
                                    ? "bg-green-500 text-white shadow-lg shadow-green-200"
                                    : "bg-gray-800 text-white hover:bg-gray-900 shadow-lg"
                                    }`}
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400">
                            このIDをスタッフに共有してください
                        </p>
                    </div>

                    <hr className="border-gray-100" />

                    {/* メンバーリスト */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Team Members ({members.length})
                        </h3>

                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
                            ) : members.length > 0 ? (
                                members.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        {/* アイコン */}
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                                            {member.photoURL ? (
                                                <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCircle2 className="w-6 h-6 text-gray-300" />
                                            )}
                                        </div>

                                        {/* 名前と役職 */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 text-sm truncate">{member.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                {member.role === 'owner' ? (
                                                    <span className="text-amber-500 flex items-center gap-1 font-medium"><Crown className="w-3 h-3" /> Owner</span>
                                                ) : (
                                                    "Staff"
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 italic">メンバーがいません</p>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* ログアウトボタン */}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="w-full py-4 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-5 h-5" />
                            ログアウト
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}