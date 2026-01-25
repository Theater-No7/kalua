"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Search, Plus, LayoutList, Kanban, Filter, Trash2, Eye, EyeOff, CheckSquare, X } from "lucide-react"
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { AddRecipeModal } from "./AddRecipeModal"
import { RecipeDetailScreen } from "./RecipeDetailScreen"
import { ShopSettingsModal } from "./ShopSettingsModal"
import { CategorySettingsView } from "./CategorySettingsView"

import { DashboardLayout } from "./layouts/DashboardLayout"
import { RecipeCardGrid } from "./dashboard/RecipeCardGrid"
import { RecipeListView } from "./dashboard/RecipeListView"
import { RecipeBoardView } from "./dashboard/RecipeBoardView"
import { RecipeSidePanel } from "./dashboard/RecipeSidePanel"

// Type
export interface Recipe {
    id: string
    title: string

    // Single Category
    categoryId?: string
    category?: string // Legacy/Name

    // Legacy mapping (migrated on read)
    categoryIds?: string[]

    // UI Helpers
    displayCategoryName?: string

    tags: string[]
    image?: string
    ingredients?: string[]
    steps?: string
    createdAt?: any
    isVisible?: boolean // Display Flag
}

import { useAuth } from "@/contexts/AuthContext"

interface RecipeListScreenProps {
    shopId: string
    onLogout?: () => void
}

export function RecipeListScreen({ shopId, onLogout }: RecipeListScreenProps) {
    const { role } = useAuth()
    // ...
    // States
    // ------------------------------------------------------------
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Filters
    const [selectedCategoryId, setSelectedCategoryId] = useState("All")
    const [selectedTag, setSelectedTag] = useState("All")

    // Selection (Bulk Actions)
    const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set())

    // View State
    const [activeTab, setActiveTab] = useState<"recipes" | "categories" | "settings">("recipes")
    const [viewMode, setViewMode] = useState<"list" | "board">("list")

    // Selection State (Editing)
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)
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

    // Maintain a Derived List of Recipes with resolved Category Data
    const processedRecipes = useMemo(() => recipes.map(r => {
        let catId = r.categoryId

        // Migration Fallback
        if (!catId && r.categoryIds && r.categoryIds.length > 0) {
            catId = r.categoryIds[0]
        }

        // Name Fallback
        if (!catId && r.category) {
            const cat = categories.find(c => c.name === r.category)
            if (cat) catId = cat.id
        }

        // Resolve Name
        const name = categories.find(c => c.id === catId)?.name || r.category || "Uncategorized"

        return {
            ...r,
            categoryId: catId,
            displayCategoryName: name
        }
    }), [recipes, categories])

    // Collect all unique tags for filter dropdown
    const allTags = useMemo(() => {
        const tags = new Set<string>()
        processedRecipes.forEach(r => r.tags?.forEach(t => tags.add(t)))
        return Array.from(tags).sort()
    }, [processedRecipes])

    // ------------------------------------------------------------
    // Filter Logic
    // ------------------------------------------------------------
    const filteredRecipes = useMemo(() => processedRecipes.filter((recipe) => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

        let matchesCategory = true
        if (selectedCategoryId !== "All") {
            // Strict ID Check
            matchesCategory = recipe.categoryId === selectedCategoryId
        }

        let matchesTag = true
        if (selectedTag !== "All") {
            matchesTag = (recipe.tags || []).includes(selectedTag)
        }

        return matchesSearch && matchesCategory && matchesTag
    }), [processedRecipes, searchQuery, selectedCategoryId, selectedTag])

    // ------------------------------------------------------------
    // Bulk Selection Handlers
    // ------------------------------------------------------------
    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedRecipeIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedRecipeIds(newSet)
    }

    const handleSelectAll = () => {
        // Toggle Logic: If all filtered are selected, deselect them. Otherwise, select all filtered.
        const allFilteredIds = filteredRecipes.map(r => r.id)
        const allSelected = allFilteredIds.every(id => selectedRecipeIds.has(id))

        const newSet = new Set(selectedRecipeIds)

        if (allSelected) {
            // Deselect all visible
            allFilteredIds.forEach(id => newSet.delete(id))
        } else {
            // Select all visible
            allFilteredIds.forEach(id => newSet.add(id))
        }
        setSelectedRecipeIds(newSet)
    }

    const handleBatchVisibility = async (targetVisible: boolean) => {
        if (selectedRecipeIds.size === 0) return
        try {
            const batch = writeBatch(db)
            selectedRecipeIds.forEach(id => {
                const ref = doc(db, "stores", shopId, "recipes", id)
                batch.update(ref, { isVisible: targetVisible })
            })
            await batch.commit()
            setSelectedRecipeIds(new Set()) // Clear selection
        } catch (error) {
            console.error("Batch update failed", error)
            alert("Failed to update recipes")
        }
    }

    const handleBatchDelete = async () => {
        if (selectedRecipeIds.size === 0) return
        if (!window.confirm(`Delete ${selectedRecipeIds.size} recipes? This cannot be undone.`)) return

        try {
            const batch = writeBatch(db)
            selectedRecipeIds.forEach(id => {
                const ref = doc(db, "stores", shopId, "recipes", id)
                batch.delete(ref)
            })
            await batch.commit()
            setSelectedRecipeIds(new Set()) // Clear selection
        } catch (error) {
            console.error("Batch delete failed", error)
            alert("Failed to delete recipes")
        }
    }

    // ------------------------------------------------------------
    // Single Handlers
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

    const handleToggleVisibility = async (recipe: Recipe) => {
        const newStatus = !(recipe.isVisible !== false)
        try {
            const recipeRef = doc(db, "stores", shopId, "recipes", recipe.id)
            await updateDoc(recipeRef, {
                isVisible: newStatus
            })
        } catch (error) {
            console.error("Error toggling visibility: ", error);
            alert("Failed to update status")
        }
    }

    const handleCreateNew = () => {
        setIsEditing(true)
        setSelectedRecipe(null)
        setIsMobileModalOpen(true)
    }

    const handleDesktopSelect = (recipe: Recipe) => {
        // If actively selecting checkboxes, maybe row click should select checkbox? 
        // Logic: Clicking anywhere in row selects recipe for PREVIEW/EDIT (Standard behavior). 
        // Checkbox handles Selection.
        setSelectedRecipe(recipe)
        setIsEditing(true)
    }

    const handleMobileSelect = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
    }

    const handleSaveComplete = () => {
        setIsEditing(false)
        setIsMobileModalOpen(false)
        if (selectedRecipe && !isEditing) {
            setSelectedRecipe(null)
        }
    }

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------

    return (
        <DashboardLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            <div className="md:hidden">
                {selectedRecipe && !isEditing && (
                    <RecipeDetailScreen
                        recipe={selectedRecipe}
                        onBack={() => setSelectedRecipe(null)}
                        onEdit={() => {
                            setIsEditing(true)
                            setIsMobileModalOpen(true)
                        }}
                        onDelete={() => handleDeleteRecipe(selectedRecipe.id)}
                        isReadOnly={role === 'STAFF'}
                    />
                )}
            </div>

            <div className={`flex flex-col h-full ${selectedRecipe && !isEditing ? "hidden md:flex" : "flex"}`}>

                {/* Header */}
                <div className="px-6 py-6 md:px-8 md:py-8 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {activeTab === "recipes" && "Recipes"}
                            {activeTab === "categories" && "Categories"}
                            {activeTab === "settings" && "Settings"}
                        </h1>
                        <p className="text-gray-400 text-sm hidden md:block">Manage your cafe menu and settings</p>
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-gray-50 rounded-full">
                            <SettingsIcon />
                        </button>
                    </div>

                    {activeTab === "recipes" && role === 'OWNER' && (
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

                    {activeTab === "recipes" && (
                        <>
                            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                                {/* Bar: Search, Filters, View Toggle */}
                                <div className="px-6 py-4 md:px-8 flex flex-col xl:flex-row gap-4 shrink-0 items-start xl:items-center">
                                    {/* Search */}
                                    <div className="relative flex-1 w-full xl:w-auto">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search recipes..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-gray-50 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#0f766e]/20 transition-all border border-transparent focus:border-[#0f766e]/30"
                                        />
                                    </div>

                                    {/* Right Side Controls */}
                                    <div className="flex items-center gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">

                                        {/* View Toggle - Hidden on Mobile */}
                                        <div className="hidden md:flex bg-gray-100 p-1 rounded-lg shrink-0">
                                            <button
                                                onClick={() => setViewMode("list")}
                                                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                                title="List View"
                                            >
                                                <LayoutList className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setViewMode("board")}
                                                className={`p-1.5 rounded-md transition-all ${viewMode === "board" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                                title="Board View"
                                            >
                                                <Kanban className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Tag Filter Dropdown */}
                                        <div className="relative shrink-0">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <Filter className="w-3.5 h-3.5" />
                                            </div>
                                            <select
                                                value={selectedTag}
                                                onChange={(e) => setSelectedTag(e.target.value)}
                                                className="pl-9 pr-8 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 appearance-none focus:ring-2 focus:ring-[#0f766e]/20 outline-none cursor-pointer"
                                            >
                                                <option value="All">All Tags</option>
                                                {allTags.map(tag => (
                                                    <option key={tag} value={tag}>#{tag}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Filters */}
                                        <div className="flex gap-2">
                                            <FilterButton
                                                active={selectedCategoryId === "All"}
                                                onClick={() => setSelectedCategoryId("All")}
                                                label="All"
                                            />
                                            {categories.map((cat) => (
                                                <FilterButton
                                                    key={cat.id}
                                                    active={selectedCategoryId === cat.id}
                                                    onClick={() => setSelectedCategoryId(cat.id)}
                                                    label={cat.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* List Views */}
                                <div className="flex-1 overflow-y-auto px-6 pb-24 md:px-0 md:pb-0 bg-white">
                                    {/* viewMode Switch - Force List on Mobile */}
                                    <div className="md:hidden pt-4">
                                        <RecipeCardGrid
                                            recipes={filteredRecipes}
                                            onSelect={handleMobileSelect}
                                            onToggleVisibility={handleToggleVisibility}
                                        />
                                    </div>

                                    <div className="hidden md:block h-full">
                                        {viewMode === "list" ? (
                                            <div className="h-full pb-20">
                                                <RecipeListView
                                                    recipes={filteredRecipes}
                                                    onSelect={handleDesktopSelect}
                                                    selectedId={isEditing && selectedRecipe ? selectedRecipe.id : undefined}
                                                    onToggleVisibility={handleToggleVisibility}

                                                    // Selection Props (Hide for Staff)
                                                    selectedRecipeIds={selectedRecipeIds}
                                                    onSelectOne={handleSelectOne}
                                                    onSelectAll={handleSelectAll}
                                                    isReadOnly={role === 'STAFF'} // Pass ReadOnly
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-full">
                                                <RecipeBoardView
                                                    shopId={shopId}
                                                    recipes={filteredRecipes}
                                                    categories={categories}
                                                    onSelect={(recipe) => {
                                                        if (window.innerWidth < 768) {
                                                            handleMobileSelect(recipe)
                                                        } else {
                                                            handleDesktopSelect(recipe)
                                                        }
                                                    }}
                                                    isReadOnly={role === 'STAFF'}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bulk Action Bar (Overlay) */}
                                {selectedRecipeIds.size > 0 && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
                                        <div className="bg-gray-900 text-white rounded-full px-6 py-3 flex items-center gap-6 shadow-xl border border-gray-700/50">
                                            <div className="flex items-center gap-3 pr-4 border-r border-gray-700">
                                                <div className="bg-[#0f766e] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {selectedRecipeIds.size}
                                                </div>
                                                <span className="text-sm font-medium">Selected</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleBatchVisibility(true)}
                                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-300 hover:text-white tooltip-trigger"
                                                    title="Show All"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleBatchVisibility(false)}
                                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-300 hover:text-white"
                                                    title="Hide All"
                                                >
                                                    <EyeOff className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={handleBatchDelete}
                                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-gray-300 ml-2"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setSelectedRecipeIds(new Set())}
                                                className="ml-2 hover:bg-gray-800 p-1 rounded-full text-gray-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <RecipeSidePanel
                                isOpen={isEditing}
                                onClose={() => {
                                    setIsEditing(false)
                                    setSelectedRecipe(null)
                                }}
                                shopId={shopId}
                                editingRecipe={selectedRecipe}
                                onSave={() => {
                                    setIsEditing(false)
                                    setSelectedRecipe(null)
                                }}
                                isReadOnly={role === 'STAFF'}
                            />
                        </>
                    )}

                    {activeTab === "categories" && (
                        <div className="flex-1 h-full overflow-hidden">
                            <div className="h-full md:p-8">
                                <div className="h-full md:bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm overflow-hidden">
                                    <CategorySettingsView
                                        shopId={shopId}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="flex-1 p-6 md:p-8">
                            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

                {activeTab === "recipes" && role === 'OWNER' && (
                    <button
                        onClick={handleCreateNew}
                        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#0f766e] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0d6560] transition-colors z-20"
                    >
                        <Plus className="text-white w-6 h-6" />
                    </button>
                )}
            </div>

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

            <ShopSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                shopId={shopId}
                onLogout={onLogout}
            />

        </DashboardLayout>
    )
}

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