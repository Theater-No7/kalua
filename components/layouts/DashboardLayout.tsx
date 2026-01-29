"use client"

import React from "react"
import { Coffee, Settings, LayoutGrid, Bell } from "lucide-react"
import { DebugInfoOverlay } from "@/components/debug/DebugInfoOverlay"
import { useAuth } from "@/contexts/AuthContext"

interface DashboardLayoutProps {
    children: React.ReactNode
    activeTab: "recipes" | "categories" | "settings" | "notifications"
    onTabChange: (tab: "recipes" | "categories" | "settings" | "notifications") => void
    shopName?: string
    unreadCount?: number
}

export function DashboardLayout({ children, activeTab, onTabChange, shopName = "Kalua", unreadCount = 0 }: DashboardLayoutProps) {
    const { role } = useAuth()

    return (
        <div className="flex min-h-screen bg-slate-50 w-full">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0">
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0f766e] rounded-lg flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="font-bold text-xl text-gray-800">{shopName}</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem
                        icon={Coffee}
                        label="Recipes"
                        isActive={activeTab === "recipes"}
                        onClick={() => onTabChange("recipes")}
                    />

                    {role === 'OWNER' && (
                        <SidebarItem
                            icon={LayoutGrid}
                            label="Categories"
                            isActive={activeTab === "categories"}
                            onClick={() => onTabChange("categories")}
                        />
                    )}

                    <SidebarItem
                        icon={Bell}
                        label="Notifications"
                        isActive={activeTab === "notifications"}
                        onClick={() => onTabChange("notifications")}
                        badge={unreadCount > 0 ? unreadCount : undefined}
                    />
                    <SidebarItem
                        icon={Settings}
                        label="Settings"
                        isActive={activeTab === "settings"}
                        onClick={() => onTabChange("settings")}
                    />
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <p className="text-xs text-gray-400 text-center">
                        Kalua v1.0.0
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 md:bg-white md:m-0 w-full">
                {children}
            </main>

            {/* Debug Info Overlay */}
            <DebugInfoOverlay />
        </div>
    )
}

function SidebarItem({ icon: Icon, label, isActive, onClick, badge }: { icon: any, label: string, isActive: boolean, onClick: () => void, badge?: number }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                ? "bg-[#0f766e]/10 text-[#0f766e]"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                {label}
            </div>
            {badge !== undefined && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {badge > 99 ? "99+" : badge}
                </span>
            )}
        </button>
    )
}
