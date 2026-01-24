"use client";

import { useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// 作ったコンポーネントを読み込み（ファイル名は実際のものに合わせてください）
import { WelcomeScreen } from "../components/WelcomeScreen";
import { RecipeListScreen } from "../components/RecipeListScreen";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 読み込み中フラグ

  // ログイン状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ログイン処理（WelcomeScreenから呼ばれる）
  const handleLogin = async () => {
    try {
      const credential = await signInAnonymously(auth);
      const user = credential.user;

      // ユーザー登録処理
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          name: "ゲストスタッフ",
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Login failed", error);
      alert("ログインに失敗しました");
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ログインしていればレシピ一覧、していなければウェルカム画面を表示 */}
      {user ? (
        <RecipeListScreen onLogout={handleLogout} />
      ) : (
        // onLoginという名前で関数を渡す（WelcomeScreen側でこれを受け取る必要があります！）
        <WelcomeScreen onLogin={handleLogin} />
      )}
    </main>
  );
}