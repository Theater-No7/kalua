"use client"

import React, { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Loader2, Shield, User } from "lucide-react"

// useRouterは削除してOKですが、残っていてもエラーにはなりません
// import { useRouter } from "next/navigation" 

const DEMO_CREDENTIALS = {
    OWNER: {
        email: "demo-owner@kalua.app",
        pass: "kalua2026"
    },
    STAFF: {
        email: "demo-staff@kalua.app",
        pass: "kalua2026"
    }
}

export function DemoLoginSection() {
    // const router = useRouter() // 今回はwindow.locationを使うので不要
    const [isLoading, setIsLoading] = useState<{ owner: boolean, staff: boolean }>({ owner: false, staff: false })

    const handleDemoLogin = async (role: 'OWNER' | 'STAFF') => {
        const { email, pass } = DEMO_CREDENTIALS[role]

        try {
            setIsLoading(prev => ({ ...prev, [role.toLowerCase()]: true }))

            console.log(`Attempting login as ${role}...`)
            await signInWithEmailAndPassword(auth, email, pass)

            console.log(`Login successful as ${role}`)

            // router.push('/dashboard') ではなく、ルート('/')へリロード遷移します
            window.location.href = '/'

        } catch (error: any) {
            console.error("Demo login failed:", error)

            // エラー時のみローディングを解除（成功時は画面遷移するまで回しっぱなしにする）
            setIsLoading(prev => ({ ...prev, [role.toLowerCase()]: false }))

            let message = "デモログインに失敗しました。"
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                message += "\nアカウントが見つからないか、パスワードが変更されています。"
            } else if (error.code === 'auth/wrong-password') {
                message += "\nパスワードが間違っています。"
            } else if (error.code === 'auth/too-many-requests') {
                message += "\n試行回数が多すぎます。しばらく待ってから再試行してください。"
            } else {
                message += `\nエラーコード: ${error.code}\n${error.message}`
            }
            alert(message)
        }
        // finally ブロックを削除しました
        // 成功時に isLoading を false に戻してしまうと、画面遷移までの僅かな間に
        // 「Signing in...」が「Try as Owner」に戻ってしまい、見た目がガタつくためです。
    }

    const isGlobalLoading = isLoading.owner || isLoading.staff

    return (
        <div className="w-full mt-6 pt-6 border-t border-white/20">
            <h3 className="text-emerald-50 text-xs font-bold text-center mb-4 uppercase tracking-wider">
                Try Demo (No account required)
            </h3>

            <p className="text-emerald-100/80 text-[10px] text-center mb-4 leading-relaxed">
                採用担当者様はこちらからお試しください。<br />
                データ入力済みの環境にアクセスできます。
            </p>

            <div className="space-y-3">
                {/* Owner Login */}
                <button
                    type="button"
                    onClick={() => handleDemoLogin('OWNER')}
                    disabled={isGlobalLoading}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed border border-gray-700"
                >
                    {isLoading.owner ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4 text-purple-400" />
                            Try as Owner
                        </>
                    )}
                </button>

                {/* Staff Login */}
                <button
                    type="button"
                    onClick={() => handleDemoLogin('STAFF')}
                    disabled={isGlobalLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed border border-emerald-500"
                >
                    {isLoading.staff ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            <User className="w-4 h-4 text-emerald-200" />
                            Try as Staff
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}