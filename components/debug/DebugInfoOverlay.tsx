"use client"

import { useAuth } from "@/contexts/AuthContext"

export function DebugInfoOverlay() {
    const { user, role, shopId } = useAuth()

    // Only show if user is logged in
    if (!user) return null

    // Optional: Hide in production if strictly required, 
    // but for this "Demo" app, it might be requested to stay visible.
    // if (process.env.NODE_ENV === 'production') return null

    return (
        <div className="fixed bottom-2 left-2 z-50 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-sm text-white p-2 rounded-lg text-[10px] font-mono border border-white/10 shadow-lg">
                <div className="flex flex-col gap-0.5 opacity-70">
                    <div>UID: {user.uid.slice(0, 8)}...</div>
                    <div className={role === 'STAFF' ? "text-emerald-400 font-bold" : "text-purple-400 font-bold"}>
                        ROLE: {role}
                    </div>
                    <div>SHOP: {shopId || 'None'}</div>
                </div>
            </div>
        </div>
    )
}
