"use client"

import React, { useState, useEffect } from "react"
import { onAuthStateChanged, User, signOut } from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Loader2 } from "lucide-react"

import { WelcomeScreen } from "@/components/WelcomeScreen"
import { RecipeListScreen } from "@/components/RecipeListScreen"
import { CreateShopScreen } from "@/components/CreateShopScreen" // 追加

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [shopId, setShopId] = useState<string | null>(null) // shopIdを持つ
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            // ユーザーデータがあるなら、shopIdを持っているか確認
            const userData = userSnap.data()
            if (userData.shopId) {
              setShopId(userData.shopId)
            }
          } else {
            // ユーザーデータがない場合（新規作成）
            await setDoc(userRef, {
              id: currentUser.uid,
              name: currentUser.displayName || (currentUser.isAnonymous ? "ゲストスタッフ" : "No Name"),
              photoURL: currentUser.photoURL || null,
              createdAt: serverTimestamp(),
            })
          }
        } catch (error) {
          console.error("User DB sync failed:", error)
        }
      } else {
        setShopId(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    setShopId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 text-[#0f766e] animate-spin" />
      </div>
    )
  }

  // 1. 未ログイン -> Welcome画面
  if (!user) {
    return <WelcomeScreen onLogin={() => { }} />
  }

  // 2. ログイン済みだが、店がない -> 店舗作成画面
  if (!shopId) {
    return (
      <CreateShopScreen
        userId={user.uid}
        onShopCreated={(newId) => setShopId(newId)}
      />
    )
  }

  // 3. 店がある -> レシピ一覧（shopIdを渡す！）
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden md:max-w-none md:w-full md:mx-0 md:h-screen md:flex md:shadow-none">
      <RecipeListScreen shopId={shopId} onLogout={handleLogout} />
    </div>
  )
}