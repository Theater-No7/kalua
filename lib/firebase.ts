import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBX2sPF31iDkxIxaP6FlBXH3Vt4Wgahdis",
    authDomain: "kalua-app-cb8e9.firebaseapp.com",
    projectId: "kalua-app-cb8e9",
    storageBucket: "kalua-app-cb8e9.firebasestorage.app",
    messagingSenderId: "638528212104",
    appId: "1:638528212104:web:ec75b85a5558b2da1d233d"
};

// アプリの初期化（二重初期化を防ぐおまじない）
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 他のファイルで使えるようにエクスポート
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);