"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { AddRecipeModal } from "./AddRecipeModal"
import { RecipeDetailScreen } from "./RecipeDetailScreen"
import { ShopSettingsModal } from "./ShopSettingsModal"
import { CategorySettingsScreen } from "./CategorySettingsScreen"

import { DashboardLayout } from "./layouts/DashboardLayout"
import { RecipeCardGrid } from "./dashboard/RecipeCardGrid"
import { RecipeListView } from "./dashboard/RecipeListView"
import { RecipeSidePanel } from "./dashboard/RecipeSidePanel"

// Type
export interface Recipe {
    id: string
    title: string
    category: string
    tags: string[]
    image?: string
    ingredients?: string[]
    steps?: string
    createdAt?: any
}

interface RecipeListScreenProps {
    shopId: string
    onLogout?: () => void
}

export function RecipeListScreen({ shopId, onLogout }: RecipeListScreenProps) {
    // ------------------------------------------------------------
    // States
    // ------------------------------------------------------------
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")

    // View State
    const [activeTab, setActiveTab] = useState<"recipes" | "categories" | "settings">("recipes")

    // Selection State (Shared between Mobile Modal & Desktop Panel)
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null) // For viewing detail on mobile, editing on desktop
    const [isEditing, setIsEditing] = useState(false) // True if editing/creating
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)

    // Old Settings Modal (Mobile)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // ------------------------------------------------------------
    // Data Fetching
    // ------------------------------------------------------------
    useEffect(() => {
        if (!shopId) return
        const q = query(collection(db, "stores", shopId, "categories"), orderBy("order", "asc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                ...doc.data()
            })) as { id: string, name: string }[]
            setCategories(cats)
        })
        return () => unsubscribe()
    }, [shopId])

    useEffect(() => {
        if (!shopId) return
        const q = query(collection(db, "stores", shopId, "recipes"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recipesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Recipe[]
            setRecipes(recipesData)
        })
        return () => unsubscribe()
    }, [shopId])

    // ------------------------------------------------------------
    // Filter Logic
    // ------------------------------------------------------------
    const filteredRecipes = recipes.filter((recipe) => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesCategory = selectedCategory === "All" || recipe.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    // ------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------
    const handleDeleteRecipe = async (recipeId: string) => {
        if (!window.confirm("Are you sure you want to delete this recipe?")) return
        try {
            await deleteDoc(doc(db, "stores", shopId, "recipes", recipeId))
            setSelectedRecipe(null)
            setIsEditing(false)
            alert("Deleted")
        } catch (error) {
            console.error("Error deleting: ", error)
            alert("Failed to delete")
        }
    }

    // Creating New
    const handleCreateNew = () => {
        setIsEditing(true)
        setSelectedRecipe(null)
        // Check viewport to decide Mobile Modal vs Desktop Panel?
        // Actually CSS hidden classes handle rendering, but state is shared.
        // We can just set state. Mobile renders Modal if isEditing is true (maybe complex).
        // Let's keep existing mobile flow: Detail -> Edit.
        // But for "New", Mobile uses Modal immediately.
        setIsMobileModalOpen(true)
    }

    // Selecting (Desktop)
    const handleDesktopSelect = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setIsEditing(true)
    }

    // Selecting (Mobile)
    const handleMobileSelect = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        // Mobile navigates to Detail Screen, not Edit Panel immediately
    }

    // Save Complete
    const handleSaveComplete = () => {
        setIsEditing(false)
        setIsMobileModalOpen(false)
        if (selectedRecipe && !isEditing) {
            // If we were just viewing, clear selection? Or keep it?
            // On desktop, keep selection implies "still editing".
            // Let's clear for now to close panel.
            setSelectedRecipe(null)
        }
    }

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------

    // Mobile Detail Screen Interception
    // Note: On Desktop, selectedRecipe is used for the SidePanel, but on Mobile it triggers the full screen detail.
    // We need to differentiate or hide DetailScreen on Desktop.

    return (
        <DashboardLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {/* ------------------------------------------------------ */}
            {/* MOBILE ONLY: Detail Screen Overlay */}
            {/* ------------------------------------------------------ */}
            <div className="md:hidden">
                {selectedRecipe && !isEditing && (
                    <RecipeDetailScreen
                        recipe={selectedRecipe}
                        onBack={() => setSelectedRecipe(null)}
                        onEdit={() => {
                            setIsEditing(true)
                            setIsMobileModalOpen(true) // Open Edit Modal
                        }}
                        onDelete={() => handleDeleteRecipe(selectedRecipe.id)}
                    />
                )}
            </div>

            {/* ------------------------------------------------------ */}
            {/* MAIN CONTENT AREA */}
            {/* ------------------------------------------------------ */}
            <div className={`flex flex-col h-full ${selectedRecipe && !isEditing ? "hidden md:flex" : "flex"}`}>
                {/* ^ On mobile, if detail is open, hide main list. On desktop, always show list. */}

                {/* Header (Adapts to Tab) */}
                <div className="px-6 py-6 md:px-8 md:py-8 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {activeTab === "recipes" && "Recipes"}
                            {activeTab === "categories" && "Categories"}
                            {activeTab === "settings" && "Settings"}
                        </h1>
                        <p className="text-gray-400 text-sm hidden md:block">Manage your cafe menu and settings</p>
                    </div>

                    {/* Mobile Settings Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-gray-50 rounded-full">
                            <SettingsIcon />
                        </button>
                    </div>

                    {/* Desktop: Add Button (Only on Recipes Tab) */}
                    {activeTab === "recipes" && (
                        <button
                            onClick={handleCreateNew}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#0f766e] text-white rounded-lg font-bold hover:bg-[#0d6560] transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="text-sm">New Recipe</span>
                        </button>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-hidden relative flex">

                    {/* --------------------- */}
                    {/* TAB: RECIPES */}
                    {/* --------------------- */}
                    {activeTab === "recipes" && (
                        <>
                            {/* Main List Area */}
                            <div className="flex-1 flex flex-col min-w-0 h-full">
                                {/* Search & Filters Bar */}
                                <div className="px-6 py-4 md:px-8 flex flex-col md:flex-row gap-4 shrink-0">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search recipes..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-gray-50 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#0f766e]/20 transition-all border border-transparent focus:border-[#0f766e]/30"
                                        />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                        <FilterButton
                                            active={selectedCategory === "All"}
                                            onClick={() => setSelectedCategory("All")}
                                            label="All"
                                        />
                                        {categories.map((cat) => (
                                            <FilterButton
                                                key={cat.id}
                                                active={selectedCategory === cat.name}
                                                onClick={() => setSelectedCategory(cat.name)}
                                                label={cat.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* List Views */}
                                <div className="flex-1 overflow-y-auto px-6 pb-24 md:px-0 md:pb-0">
                                    {/* Mobile Grid */}
                                    <div className="md:hidden">
                                        <RecipeCardGrid
                                            recipes={filteredRecipes}
                                            onSelect={handleMobileSelect}
                                        />
                                    </div>

                                    {/* Desktop Table (Full Width) */}
                                    <div className="hidden md:block h-full">
                                        <RecipeListView
                                            recipes={filteredRecipes}
                                            onSelect={handleDesktopSelect}
                                            selectedId={isEditing && selectedRecipe ? selectedRecipe.id : undefined}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Side Panel (Slide Over) */}
                            <RecipeSidePanel
                                isOpen={isEditing} // Open when editing (create or update)
                                onClose={() => {
                                    setIsEditing(false)
                                    setSelectedRecipe(null)
                                }}
                                shopId={shopId}
                                editingRecipe={selectedRecipe} // Pass selected recipe for editing
                                onSave={() => {
                                    // Refresh or just close
                                    setIsEditing(false)
                                    setSelectedRecipe(null)
                                }}
                            />
                        </>
                    )}

                    {/* --------------------- */}
                    {/* TAB: CATEGORIES */}
                    {/* --------------------- */}
                    {activeTab === "categories" && (
                        <div className="flex-1 h-full overflow-hidden">
                            {/* Reuse existing component but wrap it to fit dashboard */}
                            <div className="h-full md:p-8">
                                <div className="h-full md:bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm overflow-hidden">
                                    <CategorySettingsScreen
                                        shopId={shopId}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --------------------- */}
                    {/* TAB: SETTINGS */}
                    {/* --------------------- */}
                    {activeTab === "settings" && (
                        <div className="flex-1 p-6 md:p-8">
                            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Just render the content of ShopSettingsModal inline? 
                                     The Modal component has its own header/close logic. 
                                     Ideally we extract content, but for now let's use the Modal ONLY for mobile via floating button,
                                     and maybe a PLACEHOLDER here for desktop saying "Use mobile for settings" or refactor fully.
                                     
                                     Wait, the user requirement says "Categories integrated". Settings can stay modal on mobile.
                                     On desktop, let's show a simple settings page or just re-open the modal logic inline?
                                     
                                     Actually, let's just trigger the Modal logic for now even on Desktop if they click settings tab?
                                     No, that's weird UI.
                                     
                                     Let's render a simple placeholder for Settings Tab or reuse the Modal content if possible.
                                     Since I didn't refactor ShopSettingsModal to separate content, I will just show a "Coming Soon" or 
                                     manual implementation of logout button here for Desktop.
                                 */}
                                <div className="p-8 text-center">
                                    <h3 className="font-bold text-gray-800 mb-2">Shop ID</h3>
                                    <code className="bg-gray-100 px-4 py-2 rounded-lg block mb-6">{shopId}</code>

                                    {onLogout && (
                                        <button
                                            onClick={onLogout}
                                            className="text-red-500 font-bold hover:bg-red-50 px-6 py-2 rounded-lg transition-colors"
                                        >
                                            Logout
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Mobile Floating Action Button (Create) */}
                {activeTab === "recipes" && (
                    <button
                        onClick={handleCreateNew}
                        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#0f766e] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0d6560] transition-colors z-20"
                    >
                        <Plus className="text-white w-6 h-6" />
                    </button>
                )}
            </div>

            {/* ------------------------------------------------------ */}
            {/* MODALS (Mobile / Overlays) */}
            {/* ------------------------------------------------------ */}

            {/* Create/Edit Modal (Mobile Only mostly, but logic shared) */}
            {/* Create/Edit Modal (Mobile Only mostly, but logic shared) */}
            <div className="md:hidden">
                <AddRecipeModal
                    isOpen={isMobileModalOpen}
                    onClose={() => {
                        setIsMobileModalOpen(false)
                        setIsEditing(false)
                    }}
                    onSave={handleSaveComplete}
                    editingRecipe={selectedRecipe}
                    shopId={shopId}
                />
            </div>

            {/* Shop Settings Modal (Mobile Triggered) */}
            <ShopSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                shopId={shopId}
                onLogout={onLogout}
            />

        </DashboardLayout>
    )
}

// Helper Components
function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${active
                ? "bg-[#0f766e] text-white"
                : "bg-white border border-[#e0e0e0] text-[#666666] hover:bg-gray-50"
                }`}
        >
            {label}
        </button>
    )
}

function SettingsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
    )
}