"use client"

import React from "react"
import { Bell, Calendar, Coffee, ChevronRight, Info, BellOff } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"

interface NotificationsViewProps {
    shopId: string
    onSelectRecipe: (recipeId: string) => void
}

export function NotificationsView({ shopId, onSelectRecipe }: NotificationsViewProps) {
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

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Bell className="w-6 h-6 text-[#0f766e]" />
                Notifications
            </h2>

            <ul className="space-y-3">
                {notifications.map((item) => (
                    <li
                        key={item.id}
                        onClick={() => onSelectRecipe(item.recipeId)}
                        className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#0f766e]/30 transition-all cursor-pointer group flex items-start gap-4"
                    >
                        {/* Icon */}
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center shrink-0
                            ${item.type === 'create' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}
                        `}>
                            {item.type === 'create' ? <Coffee className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.type === 'create' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                    }`}>
                                    {item.type === 'create' ? "New Recipe" : "Update"}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() + " " + new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                </span>
                            </div>

                            <h3 className="font-bold text-gray-800 text-sm md:text-base group-hover:text-[#0f766e] transition-colors">
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
                ))}
            </ul>
        </div>
    )
}
