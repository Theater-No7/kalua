"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react"
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    useDroppable,
    pointerWithin,
    CollisionDetection,
} from "@dnd-kit/core"
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Coffee, EyeOff, LayoutGrid } from "lucide-react"

// Types
interface HelperRecipe {
    id: string
    title: string
    categoryId?: string
    category?: string // Legacy or Name
    displayCategoryName?: string
    image?: string
    isVisible?: boolean // Display Flag
    tags?: string[]
}

interface RecipeBoardViewProps {
    shopId: string
    recipes: HelperRecipe[]
    categories: { id: string; name: string }[]
    onSelect: (recipe: any) => void
}

const UNNAMED_ID = "uncategorized"

export function RecipeBoardView({ shopId, recipes, categories, onSelect }: RecipeBoardViewProps) {
    // Local State for Optimistic UI
    const [localRecipes, setLocalRecipes] = useState<HelperRecipe[]>(recipes)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeItem, setActiveItem] = useState<HelperRecipe | null>(null)

    // Sync with props whenever recipes prop changes (and we are not dragging ideally, but for now simple sync)
    // dnd-kit recommends avoiding syncing during drag if possible, but our drag is fast.
    useEffect(() => {
        if (!activeId) {
            setLocalRecipes(recipes)
        }
    }, [recipes, activeId])

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // Custom Collision Detection
    const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
        // Prioritize pointerWithin for precise container detection
        const pointerCollisions = pointerWithin(args)

        // If pointer is strictly within a container/droppable, use that
        if (pointerCollisions.length > 0) {
            return pointerCollisions
        }

        // Fallback to closestCorners
        return closestCorners(args)
    }, [])

    // Memoize columns data based on LOCAL state
    const columns = useMemo(() => {
        const cols: Record<string, HelperRecipe[]> = {}

        // Initialize columns
        cols[UNNAMED_ID] = []
        categories.forEach(cat => {
            cols[cat.id] = []
        })

        localRecipes.forEach(recipe => {
            let placed = false

            // Resolve Category ID
            let catId = recipe.categoryId

            // Fallbacks if migrating or using name
            if (!catId && recipe.category) {
                const cat = categories.find(c => c.name === recipe.category)
                if (cat) catId = cat.id
            }

            if (catId && cols[catId]) {
                cols[catId].push(recipe)
                placed = true
            }

            if (!placed) {
                cols[UNNAMED_ID].push(recipe)
            }
        })
        return cols
    }, [localRecipes, categories])

    // Helper to find which column an item belongs to
    // Now searching in derived `columns` from local state
    const findContainer = (id: string) => {
        if (id === UNNAMED_ID || categories.some(c => c.id === id)) {
            return id
        }
        return Object.keys(columns).find((key) =>
            columns[key].some((item) => item.id === id)
        )
    }

    // Drag Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const recipeId = active.id as string
        const recipe = localRecipes.find(r => r.id === recipeId)
        setActiveId(recipeId)
        setActiveItem(recipe || null)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        // Find the containers
        const activeContainer = findContainer(activeId)
        // If 'over' is a container (judging by ID match to cols), precise.
        // Or check `over.data.current?.type`.
        const isOverContainer = over.data.current?.type === 'Container' || overId === UNNAMED_ID || categories.some(c => c.id === overId)

        const overContainer = isOverContainer
            ? overId
            : findContainer(overId)

        if (
            !activeContainer ||
            !overContainer ||
            activeContainer === overContainer
        ) {
            return
        }

        // Logic: Move item to the new container immediately in Local State
        setLocalRecipes((prev) => {
            return prev.map(r => {
                if (r.id === activeId) {
                    // Update categoryId to the new container ID
                    // If overContainer is UNNAMED_ID, setting to null/undefined or special value depending on schema
                    // Our schema uses `categoryId`. UNNAMED_ID is virtual.
                    // If dropping to UNNAMED, we set categoryId to null or empty? 
                    // Let's keep it consistent: categoryId = null for uncategorized.

                    const newCategoryId = overContainer === UNNAMED_ID ? undefined : overContainer
                    return { ...r, categoryId: newCategoryId }
                }
                return r
            })
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)
        setActiveItem(null)

        if (!over) return

        // At this point, local state should already be updated via onDragOver.
        // We just need to persist the change for the `active` item.
        // However, we should verify the final state or just persist the move.

        const recipeId = active.id as string
        const finalContainer = findContainer(recipeId)
        // This findContainer uses the *updated* columns from render, 
        // but verify if `columns` definition has updated yet? 
        // It should have re-rendered.

        // Actually simpler:
        // We check what the `categoryId` should be based on where we dropped.
        // But `onDragOver` has handled the logic of "being over a container".
        // If we just dropped, `active` payload gives us the ID.
        // We can just check `localRecipes` for the final state of this item?

        // Let's use `over` to determine final destination again to be safe and robust against fast drops.

        const overId = over.id as string
        let targetColId = overId

        // Is it a column?
        const isColumn = overId === UNNAMED_ID || categories.some(c => c.id === overId)

        if (!isColumn) {
            // It's a recipe. Find its col.
            const foundCol = findContainer(overId)
            if (foundCol) targetColId = foundCol
        }

        // Identify Source (Original state is tricky since we mutated it, 
        // but we only care about writing the NEW state to Firestore).
        // The original state check `sourceColId === targetColId` was to avoid writes.
        // We can check `recipes` (the prop) for original state.

        const originalRecipe = recipes.find(r => r.id === recipeId)
        let originalColId = UNNAMED_ID
        if (originalRecipe?.categoryId) {
            // Validate if that category still exists? Assuming yes.
            const cat = categories.find(c => c.id === originalRecipe.categoryId)
            if (cat) originalColId = cat.id
        }

        // If target is effectively same as original, skip
        if (targetColId === originalColId) return

        // Persist
        try {
            const batch = writeBatch(db)
            const ref = doc(db, "stores", shopId, "recipes", recipeId)

            const updates: any = {
                categoryId: targetColId === UNNAMED_ID ? null : targetColId,
                updatedAt: new Date()
            }
            if (targetColId !== UNNAMED_ID) {
                const cat = categories.find(c => c.id === targetColId)
                if (cat) updates.category = cat.name
            } else {
                updates.category = "Uncategorized"
            }

            batch.update(ref, updates)
            await batch.commit()
            console.log("Moved recipe to", targetColId)

        } catch (error) {
            console.error("Failed to move recipe", error)
            alert("Failed to move recipe")
            // Revert local state
            setLocalRecipes(recipes)
        }
    }

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: { opacity: '0.5' },
            },
        }),
    }

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden h-full bg-gray-50/50">
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetectionStrategy}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-full p-6 gap-6 min-w-max">
                    {/* Uncategorized Column */}
                    <BoardColumn
                        id={UNNAMED_ID}
                        title="Uncategorized"
                        count={columns[UNNAMED_ID]?.length || 0}
                        items={columns[UNNAMED_ID] || []}
                        onSelect={onSelect}
                        isUncategorized
                        activeId={activeId}
                    />

                    {/* Category Columns */}
                    {categories.map(cat => (
                        <BoardColumn
                            key={cat.id}
                            id={cat.id}
                            title={cat.name}
                            count={columns[cat.id]?.length || 0}
                            items={columns[cat.id] || []}
                            onSelect={onSelect}
                            activeId={activeId}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeItem ? (
                        <BoardCard recipe={activeItem} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}

// --------------------------------------------------------
// Sub Components
// --------------------------------------------------------

interface BoardColumnProps {
    id: string
    title: string
    count: number
    items: HelperRecipe[]
    onSelect: (recipe: any) => void
    isUncategorized?: boolean
    activeId?: string | null
}

function BoardColumn({ id, title, count, items, onSelect, isUncategorized, activeId }: BoardColumnProps) {
    // Droppable for the Container
    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: { type: 'Container', categoryId: id }
    })

    // Background Active Logic:
    // 1. isOver the container directly
    // 2. OR the active item is logically "inside" this column (due to onDragOver update)
    const isActive = isOver || (activeId ? items.some(i => i.id === activeId) : false)

    return (
        <div
            ref={setNodeRef} // Apply Ref to optimal outer wrapper
            className={`flex flex-col w-80 h-full max-h-full rounded-2xl border flex-shrink-0 transition-colors duration-200
                ${isActive ? "bg-gray-200 border-emerald-400/50" : "bg-gray-100/50 border-gray-200/50"}
            `}
        >
            {/* Header */}
            <div className={`p-4 border-b border-gray-200/50 flex items-center justify-between sticky top-0 bg-inherit rounded-t-2xl z-10 ${isUncategorized ? "bg-gray-100" : ""}`}>
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-700 text-sm">{title}</h3>
                    <span className="bg-gray-200 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                        {count}
                    </span>
                </div>
                {isUncategorized && <LayoutGrid className="w-4 h-4 text-gray-400" />}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[500px]">
                <SortableContext
                    items={items.map(r => r.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((recipe) => (
                        <SortableItem
                            key={recipe.id}
                            uniqueId={recipe.id}
                            recipe={recipe}
                            onSelect={onSelect}
                        />
                    ))}
                </SortableContext>

                {items.length === 0 && (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs italic pointer-events-none min-h-[100px]">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    )
}

interface SortableItemProps {
    uniqueId: string
    recipe: HelperRecipe
    onSelect: (r: any) => void
}

function SortableItem({ uniqueId, recipe, onSelect }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: uniqueId })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <BoardCard recipe={recipe} onClick={() => onSelect(recipe)} />
        </div>
    )
}

interface BoardCardProps {
    recipe: HelperRecipe
    onClick?: () => void
    isOverlay?: boolean
}

function BoardCard({ recipe, onClick, isOverlay }: BoardCardProps) {
    const isHidden = recipe.isVisible === false

    // Use SINGLE display name if available, else standard fallback
    const catName = recipe.displayCategoryName || recipe.category

    return (
        <div
            onClick={onClick}
            className={`
                bg-white p-3 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing text-left
                group hover:border-emerald-500/30 hover:shadow-md transition-all
                ${isOverlay ? "scale-105 shadow-xl border-emerald-500 rotate-2 cursor-grabbing" : "border-gray-200"}
                ${isHidden ? "opacity-60 grayscale" : ""}
            `}
        >
            <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden relative border border-gray-100">
                    {recipe.image ? (
                        <img src={recipe.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full">
                            <Coffee className="w-6 h-6 text-gray-300" />
                        </div>
                    )}
                    {isHidden && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <EyeOff className="w-5 h-5 text-white/80" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">
                        {recipe.title}
                    </h4>

                    {/* Tags (moved here as tags are important now) */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {recipe.tags && recipe.tags.length > 0 ? (
                            recipe.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded text-gray-600 bg-gray-100 font-medium truncate max-w-[80px]">
                                    #{tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] text-gray-300 italic">No Tags</span>
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}
