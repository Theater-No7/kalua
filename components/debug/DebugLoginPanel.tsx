"use client"

import React from "react"
import { useAuth, UserRole } from "@/contexts/AuthContext"
import { Shield, User, LogOut } from "lucide-react"

export function DebugLoginPanel() {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return null

    const { user, role, loginAsDebugUser, logout } = useAuth()

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-black/80 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-white/10 text-xs">
            <div className="flex flex-col gap-2">
                <div className="font-bold text-gray-400 mb-1 flex items-center justify-between">
                    <span>DEBUG AUTH</span>
                    <span className="bg-yellow-500/20 text-yellow-500 px-1.5 rounded uppercase text-[10px]">Dev</span>
                </div>

                {user ? (
                    <div className="mb-2 p-2 bg-white/10 rounded flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${role === 'OWNER' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                        <div>
                            <div className="font-bold">{role}</div>
                            <div className="text-gray-400 leading-none">{user.uid}</div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-2 text-gray-500 italic">Not logged in</div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => loginAsDebugUser("OWNER", "debug-owner-001")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 rounded transition-colors"
                    >
                        <Shield className="w-3 h-3" />
                        Owner
                    </button>
                    <button
                        onClick={() => loginAsDebugUser("STAFF", "debug-staff-001")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 rounded transition-colors"
                    >
                        <User className="w-3 h-3" />
                        Staff
                    </button>
                </div>

                {user && (
                    <button
                        onClick={logout}
                        className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded transition-colors w-full"
                    >
                        <LogOut className="w-3 h-3" />
                        Logout
                    </button>
                )}
            </div>
        </div>
    )
}
