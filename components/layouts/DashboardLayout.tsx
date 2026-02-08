"use client"

import React from "react"
import { Coffee, Settings, LayoutGrid, Bell } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface DashboardLayoutProps {
    children: React.ReactNode
    activeTab: "recipes" | "categories" | "settings" | "notifications"
    onTabChange: (tab: "recipes" | "categories" | "settings" | "notifications") => void
    shopName?: string
    unreadCount?: number
}

export function DashboardLayout({
    children,
    activeTab,
    onTabChange,
    shopName = "Kalua",
    unreadCount = 0
}: DashboardLayoutProps) {
    const { role } = useAuth()

    return (
        <div className="flex min-h-screen bg-slate-50 w-full">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0">

                {/* Header Logo */}
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0f766e] rounded-lg flex items-center justify-center shadow-sm shadow-teal-900/10">
                        <Coffee className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="font-bold text-xl text-gray-800 tracking-tight">{shopName}</h1>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem
                        icon={Coffee}
                        label="レシピ"
                        isActive={activeTab === "recipes"}
                        onClick={() => onTabChange("recipes")}
                    />

                    {role === 'OWNER' && (
                        <SidebarItem
                            icon={LayoutGrid}
                            label="カテゴリ"
                            isActive={activeTab === "categories"}
                            onClick={() => onTabChange("categories")}
                        />
                    )}

                    <SidebarItem
                        icon={Bell}
                        label="通知"
                        isActive={activeTab === "notifications"}
                        onClick={() => onTabChange("notifications")}
                        badge={unreadCount > 0 ? unreadCount : undefined}
                    />

                    {/* Settings Button
                        Settingsはモーダルで開くため、もし「activeTab」が settings になっていても
                        視覚的には「今いるページ（レシピ等）」がアクティブなままに見える方が自然な場合もあります。
                        ですが、現在はシンプルに activeTab === "settings" で判定しています。
                    */}
                    <SidebarItem
                        icon={Settings}
                        label="設定"
                        isActive={activeTab === "settings"}
                        onClick={() => onTabChange("settings")}
                    />
                </nav>

                {/* Footer Info */}
                <div className="p-4 border-t border-gray-50">
                    <p className="text-xs text-gray-400 text-center font-medium">
                        Kalua v1.0.0
                    </p>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 md:bg-white md:m-0 w-full relative">
                {children}
            </main>
        </div>
    )
}

// Sidebar Item Component
function SidebarItem({
    icon: Icon,
    label,
    isActive,
    onClick,
    badge
}: {
    icon: any,
    label: string,
    isActive: boolean,
    onClick: () => void,
    badge?: number
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                ? "bg-[#0f766e]/10 text-[#0f766e] shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? "text-[#0f766e]" : "text-gray-400 group-hover:text-gray-600"}`} />
                {label}
            </div>
            {badge !== undefined && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center shadow-sm">
                    {badge > 99 ? "99+" : badge}
                </span>
            )}
        </button>
    )
}