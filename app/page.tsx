"use client"; // 👈 これが重要！ユーザーの操作（クリックなど）を扱う印

import { useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "../lib/firebase"; // 作ったファイルを読み込み

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  // 画面が開かれたら、ログイン状態を監視する
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ログインボタンを押した時の処理
  const handleLogin = async () => {
    try {
      await signInAnonymously(auth);
      alert("いらっしゃいませ！(ログイン成功)");
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    }
  };

  // ログアウトボタンを押した時の処理
  const handleLogout = async () => {
    await signOut(auth);
    alert("お疲れ様でした！(ログアウト完了)");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-[#e8f5e9] text-stone-700 p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-10">

        {/* ロゴエリア */}
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold tracking-tight text-emerald-900 drop-shadow-sm">Kalua 🍸</h1>
          <p className="text-xl text-stone-500 font-medium tracking-wide">Barista Training App</p>
        </div>

        {/* ログイン状態による出し分け */}
        <div className="bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] space-y-8 border border-white/50">
          {user ? (
            // ログインしている時
            <>
              <div className="space-y-3">
                <p className="text-2xl font-semibold text-emerald-950">お疲れ様です！</p>
                <div className="inline-block px-4 py-1.5 bg-stone-100 rounded-full">
                  <p className="text-sm text-stone-400 font-mono tracking-wider">{user.uid.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-4 px-4 bg-transparent border-2 border-stone-300 text-stone-500 hover:text-stone-700 hover:bg-stone-50 hover:border-stone-400 rounded-2xl font-bold transition-all duration-200"
              >
                ログアウト
              </button>
            </>
          ) : (
            // ログインしていない時
            <>
              <div className="space-y-4">
                <p className="text-stone-600 leading-relaxed font-medium">
                  カフェのレシピを覚えましょう。<br />
                  <span className="text-sm text-stone-400">プロフェッショナルなスキルを磨く場所</span>
                </p>
              </div>
              <button
                onClick={handleLogin}
                className="w-full py-4 px-6 bg-[#004d40] hover:bg-[#00382e] text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                デモ入店する (Guest)
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}