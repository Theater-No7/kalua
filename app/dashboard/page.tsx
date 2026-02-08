"use client"

import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

import { WelcomeScreen } from "@/components/WelcomeScreen"
import { RecipeListScreen } from "@/components/RecipeListScreen"
import { CreateShopScreen } from "@/components/CreateShopScreen"
import { DebugLoginPanel } from "@/components/debug/DebugLoginPanel"
import { ShopSettingsModal } from "@/components/ShopSettingsModal"

export default function Page() {
    const { user, shopId, role, loading, logout: handleLogout } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
                <Loader2 className="w-8 h-8 text-[#0f766e] animate-spin" />
            </div>
        )
    }

    return (
        <>
            <MainContent
                user={user}
                shopId={shopId}
                role={role}
                handleLogout={handleLogout}
            />
            <DebugLoginPanel />
        </>
    )
}

function MainContent({ user, shopId, role, handleLogout }: any) {
    // 1. Unauthenticated -> Welcome (Allow login)
    // Note: WelcomeScreen likely handles "Real" login via its own buttons calling Liff/Firebase.
    // We rely on AuthContext to pick up the change.
    if (!user) {
        return <WelcomeScreen onLogin={() => {
            // Logic handled inside internal buttons usually, or trigger Liff login here
        }} />
    }

    // 2. Authenticated but No Shop -> Create Shop
    if (!shopId) {
        return (
            <CreateShopScreen
                userId={user.uid}
                onShopCreated={(newId) => {
                    // In real app, Context should update automatically via Firestore listener.
                    // But if we need manual trigger or reload, we might need handle logic.
                    // For now assume standard flow updates DB -> Context updates.
                    window.location.reload() // Simple sync for now
                }}
            />
        )
    }

    // 3. Authenticated & Shop Exists -> Main Dashboard

    // Future: Routing based on Role
    // if (role === 'STAFF') return <StaffScreen ... />

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

    return (
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden md:max-w-none md:w-full md:mx-0 md:h-screen md:flex md:shadow-none">
            <RecipeListScreen
                shopId={shopId}
                onLogout={handleLogout}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <ShopSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                shopId={shopId}
                onLogout={handleLogout}
            />
        </div>
    )
}