"use client"

import React, { useState } from "react"
import { MessageCircle, User, Loader2 } from "lucide-react"
import { signInWithPopup, OAuthProvider, signInAnonymously } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface WelcomeScreenProps {
    onLogin: () => void
}

export function WelcomeScreen({ onLogin }: WelcomeScreenProps) {
    const [isLoading, setIsLoading] = useState(false)

    // 🌟 LINEログイン処理
    const handleLineLogin = async () => {
        try {
            setIsLoading(true)
            // Firebaseの設定で作った「LINE」という名前のプロバイダーを指定
            const provider = new OAuthProvider("oidc.line")

            // ポップアップでログイン画面を開く
            await signInWithPopup(auth, provider)

            // 成功したら親コンポーネント(page.tsx)に伝える
            // ※ page.tsxでonAuthStateChangedを監視していれば、自動で画面が切り替わります
        } catch (error: any) {
            // 「閉じただけ」の場合は何もしない（ログも出さない）
            if (error.code === 'auth/popup-closed-by-user') {
                console.log("ログインがキャンセルされました")
                return
            }

            console.error("LINE Login failed:", error)
            alert(`ログインに失敗しました。\nエラー: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    // 👤 ゲストログイン（開発用・お試し用）
    const handleGuestLogin = async () => {
        try {
            setIsLoading(true)
            await signInAnonymously(auth)
            // ゲストログイン成功
        } catch (error) {
            console.error("Guest login failed:", error)
            alert("ゲストログインに失敗しました")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-[#0f766e] to-[#0d9488]">
            <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">

                {/* ロゴエリア */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 rotate-3">
                        <span className="text-4xl">☕️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-wide">Kalua</h1>
                    <p className="text-emerald-100 text-sm mt-1 font-medium">Cafe Recipe Manager</p>
                </div>

                {/* ボタンエリア */}
                <div className="space-y-4">
                    <button
                        onClick={handleLineLogin}
                        disabled={isLoading}
                        className="w-full bg-[#06C755] hover:bg-[#05b34c] active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <MessageCircle className="w-5 h-5 fill-current" />
                        )}
                        LINEで始める
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/20"></span>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 text-emerald-100 bg-transparent">または</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                        className="w-full bg-white text-[#0f766e] hover:bg-emerald-50 active:scale-[0.98] font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <User className="w-4 h-4" />
                        ゲストとして利用（機能制限あり）
                    </button>
                </div>

                <p className="mt-8 text-center text-[10px] text-emerald-100/60">
                    Powered by Kalua Project
                </p>
            </div>
        </div>
    )
}