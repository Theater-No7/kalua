"use client"

import React from "react"
import { Bell, Calendar, Coffee, ChevronRight, Info, BellOff, ChevronLeft } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"

import { useAuth } from "@/contexts/AuthContext"

interface NotificationsViewProps {
    shopId: string
    onSelectRecipe: (recipeId: string) => void
    onBack?: () => void
}

export function NotificationsView({ shopId, onSelectRecipe, onBack }: NotificationsViewProps) {
    const { user } = useAuth()
    const { notifications, loading } = useNotifications(shopId)

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-gray-400">
                <p>Loading notifications...</p>
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-gray-400 p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <BellOff className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="font-bold text-gray-700">No Notifications</h3>
                <p className="text-sm mt-1">You're all caught up!</p>
            </div>
        )
    }

    // Sort: Unread first, then by date desc
    const sortedNotifications = [...notifications].sort((a, b) => {
        const isReadA = user ? (a.readBy || []).includes(user.uid) : false
        const isReadB = user ? (b.readBy || []).includes(user.uid) : false

        if (isReadA === isReadB) {
            // Both unread or both read, sort by date desc
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        }
        // Unread (false) first
        return isReadA ? 1 : -1
    })

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 w-full">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-800"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-[#0f766e]" />
                    Notifications
                </h2>
            </div>

            <ul className="space-y-3">
                {sortedNotifications.map((item) => {
                    const isRead = user ? (item.readBy || []).includes(user.uid) : false

                    return (
                        <li
                            key={item.id}
                            onClick={() => onSelectRecipe(item.recipeId)}
                            className={`
                                relative rounded-xl p-4 transition-all cursor-pointer group flex items-start gap-4 border
                                ${!isRead
                                    ? "bg-white border-l-4 border-l-green-500 border-gray-100 shadow-sm hover:shadow-md"
                                    : "bg-gray-50 border-gray-100 opacity-75 hover:opacity-100 hover:bg-white"
                                }
                            `}
                        >
                            {/* Icon */}
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                ${item.type === 'create' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}
                                ${isRead && "grayscale opacity-50"}
                            `}>
                                {item.type === 'create' ? <Coffee className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    {!isRead && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mr-2 ${item.type === 'create' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                            }`}>
                                            {item.type === 'create' ? "New Recipe" : "Update"}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() + " " + new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                    </span>
                                </div>

                                <h3 className={`font-bold text-sm md:text-base transition-colors ${!isRead ? "text-gray-800" : "text-gray-600"}`}>
                                    {item.message}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                    Tap to view details for <span className="font-medium text-gray-700">{item.recipeTitle}</span>
                                </p>
                            </div>

                            {/* Arrow */}
                            <div className="self-center">
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#0f766e] group-hover:translate-x-1 transition-all" />
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
