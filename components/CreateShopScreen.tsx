"use client"

import React, { useState } from "react"
import { Store, Loader2, ArrowRight, Users, Building2 } from "lucide-react"
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface CreateShopScreenProps {
    userId: string
    onShopCreated: (shopId: string) => void
}

export function CreateShopScreen({ userId, onShopCreated }: CreateShopScreenProps) {
    const [mode, setMode] = useState<"create" | "join">("create") // モード切り替え
    const [inputVal, setInputVal] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // お店を新規作成
    const handleCreateShop = async () => {
        if (!inputVal.trim()) return
        setIsSubmitting(true)

        try {
            const shopId = `shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
            await setDoc(doc(db, "stores", shopId), {
                name: inputVal,
                ownerId: userId,
                createdAt: serverTimestamp(),
            })
            await updateDoc(doc(db, "users", userId), { shopId: shopId, role: "owner" })
            onShopCreated(shopId)
        } catch (error) {
            console.error("Failed:", error)
            alert("エラーが発生しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    // 既存のお店に参加
    const handleJoinShop = async () => {
        if (!inputVal.trim()) return
        setIsSubmitting(true)

        try {
            const shopRef = doc(db, "stores", inputVal.trim())
            const shopSnap = await getDoc(shopRef)

            if (!shopSnap.exists()) {
                alert("そのIDのお店は見つかりませんでした。\nオーナーにIDを確認してください。")
                setIsSubmitting(false)
                return
            }

            // 参加処理（shopIdをユーザーに書き込むだけ）
            await updateDoc(doc(db, "users", userId), {
                shopId: inputVal.trim(),
                role: "staff" // スタッフとして登録
            })

            alert(`${shopSnap.data().name} に参加しました！`)
            onShopCreated(inputVal.trim())

        } catch (error) {
            console.error("Failed:", error)
            alert("参加に失敗しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center transition-all">

                {/* モード切替タブ */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
                    <button
                        onClick={() => { setMode("create"); setInputVal("") }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === "create" ? "bg-white text-[#0f766e] shadow-sm" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        <Store className="w-4 h-4" /> オーナーになる
                    </button>
                    <button
                        onClick={() => { setMode("join"); setInputVal("") }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === "join" ? "bg-white text-[#0f766e] shadow-sm" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        <Users className="w-4 h-4" /> スタッフとして参加
                    </button>
                </div>

                <div className="w-16 h-16 bg-[#0f766e]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {mode === "create" ? <Building2 className="w-8 h-8 text-[#0f766e]" /> : <Users className="w-8 h-8 text-[#0f766e]" />}
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {mode === "create" ? "お店を開設しましょう" : "チームに参加しましょう"}
                </h1>
                <p className="text-gray-500 text-sm mb-8">
                    {mode === "create"
                        ? "あなたのカフェの名前を入力してください。"
                        : "オーナーから共有された「Shop ID」を入力してください。"}
                </p>

                <div className="text-left mb-6">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                        {mode === "create" ? "店舗名" : "招待コード (Shop ID)"}
                    </label>
                    <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder={mode === "create" ? "例: Chanoko Coffee" : "例: shop_12345_abcde"}
                        className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0f766e] outline-none font-medium text-lg"
                    />
                </div>

                <button
                    onClick={mode === "create" ? handleCreateShop : handleJoinShop}
                    disabled={!inputVal.trim() || isSubmitting}
                    className="w-full bg-[#0f766e] hover:bg-[#0d6560] text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "create" ? "開設する" : "参加する")}
                    {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                </button>
            </div>
        </div>
    )
}