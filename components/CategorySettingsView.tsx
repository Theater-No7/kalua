"use client"

import React, { useState, useEffect, useRef } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Plus, Loader2, Eye, EyeOff } from "lucide-react"
import { collection, query, orderBy, onSnapshot, doc, writeBatch, deleteDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface Category {
    id: string
    name: string
    order: number
    isVisible?: boolean // Visibility Flag
}

interface CategorySettingsViewProps {
    shopId: string
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export function CategorySettingsView({ shopId }: CategorySettingsViewProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Data Fetching
    useEffect(() => {
        if (!shopId) return
        // Real-time listener
        const q = query(collection(db, "stores", shopId, "categories"), orderBy("order", "asc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                isVisible: true, // Default to true if missing
                ...doc.data()
            })) as Category[]
            setCategories(cats)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [shopId])

    // --- Actions ---

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (over && active.id !== over.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id)
                const newIndex = items.findIndex(item => item.id === over.id)
                const newItems = arrayMove(items, oldIndex, newIndex)

                // Optimistic update: fire and forget the save
                saveOrder(newItems)

                return newItems
            })
        }
    }

    const saveOrder = async (items: Category[]) => {
        try {
            const batch = writeBatch(db)
            items.forEach((item, index) => {
                const ref = doc(db, "stores", shopId, "categories", item.id)
                batch.update(ref, { order: index })
            })
            await batch.commit()
        } catch (error) {
            console.error("Failed to save order:", error)
        }
    }

    const handleAddCategory = async () => {
        setIsCreating(true)
        try {
            const newOrder = categories.length
            await addDoc(collection(db, "stores", shopId, "categories"), {
                name: "New Category",
                order: newOrder,
                isVisible: true,
                createdAt: serverTimestamp()
            })
        } catch (error) {
            console.error("Failed to add category:", error)
            alert("Failed to add category")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category?")) return
        try {
            await deleteDoc(doc(db, "stores", shopId, "categories", id))
        } catch (error) {
            console.error("Failed to delete:", error)
        }
    }

    const handleUpdateName = async (id: string, newName: string) => {
        if (!newName.trim()) return
        try {
            await updateDoc(doc(db, "stores", shopId, "categories", id), {
                name: newName
            })
        } catch (error) {
            console.error("Failed to update name:", error)
        }
    }

    // Toggle Visibility
    const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
        // Optimistic UI
        setCategories(prev => prev.map(cat =>
            cat.id === id ? { ...cat, isVisible: !currentStatus } : cat
        ))

        try {
            await updateDoc(doc(db, "stores", shopId, "categories", id), {
                isVisible: !currentStatus
            })
        } catch (error) {
            console.error("Failed to toggle visibility:", error)
            // Rollback on error if strict, but ignoring for now for speed
        }
    }


    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: { opacity: '0.4' },
            },
        }),
    }

    const activeItem = categories.find(c => c.id === activeId)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white select-none">
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
                            <p className="text-gray-400 mt-1">Manage your menu categories</p>
                        </div>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={categories.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <SortableItem
                                        key={category.id}
                                        category={category}
                                        onDelete={() => handleDelete(category.id)}
                                        onUpdateName={(name) => handleUpdateName(category.id, name)}
                                        onToggleVisibility={() => handleToggleVisibility(category.id, category.isVisible ?? true)}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        <DragOverlay dropAnimation={dropAnimation}>
                            {activeItem ? (
                                <ItemContent category={activeItem} isOverlay />
                            ) : null}
                        </DragOverlay>
                    </DndContext>

                    <button
                        onClick={handleAddCategory}
                        disabled={isCreating}
                        className="
                            w-full mt-2 group flex items-center gap-3 p-4 
                            border-2 border-dashed border-gray-200 rounded-xl
                            text-gray-400 font-medium
                            hover:border-[#0f766e] hover:text-[#0f766e] hover:bg-[#0f766e]/5
                            transition-all duration-200
                        "
                    >
                        <div className="w-5 flex justify-center">
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                        </div>
                        <span>Add Category</span>
                    </button>

                </div>
            </div>
        </div>
    )
}

// ----------------------------------------------------------------------
// Sub Components
// ----------------------------------------------------------------------

interface SortableItemProps {
    category: Category
    onDelete: () => void
    onUpdateName: (name: string) => void
    onToggleVisibility: () => void
}

function SortableItem({ category, onDelete, onUpdateName, onToggleVisibility }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : "auto",
        position: 'relative' as const,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <ItemContent
                category={category}
                dragListeners={listeners}
                onDelete={onDelete}
                onUpdateName={onUpdateName}
                onToggleVisibility={onToggleVisibility}
            />
        </div>
    )
}

interface ItemContentProps {
    category: Category
    dragListeners?: any
    onDelete?: () => void
    onUpdateName?: (name: string) => void
    onToggleVisibility?: () => void
    isOverlay?: boolean
}

function ItemContent({ category, dragListeners, onDelete, onUpdateName, onToggleVisibility, isOverlay }: ItemContentProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [nameVal, setNameVal] = useState(category.name)
    const inputRef = useRef<HTMLInputElement>(null)

    // Sync state if prop changes (external update)
    useEffect(() => {
        if (!isEditing) {
            setNameVal(category.name)
        }
    }, [category.name, isEditing])

    // Focus on edit
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    const handleBlur = () => {
        setIsEditing(false)
        if (nameVal.trim() !== category.name) {
            if (nameVal.trim() === "") {
                setNameVal(category.name) // Revert if empty
            } else if (onUpdateName) {
                onUpdateName(nameVal.trim())
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            inputRef.current?.blur()
        }
    }

    const visible = category.isVisible !== false // Default true

    return (
        <div
            className={`
            group flex items-center gap-3 p-4 
            bg-white rounded-xl border border-gray-200 shadow-sm
            ${isOverlay
                    ? "shadow-xl scale-105 border-[#0f766e] ring-1 ring-[#0f766e]/20"
                    : "hover:shadow-md hover:border-gray-300"
                }
            ${!visible && !isOverlay ? "opacity-60 grayscale border-dashed" : ""}
            transition-all duration-200
            `}
        >
            {/* Drag Handle */}
            <div
                {...dragListeners}
                className="p-1 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none transition-colors"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            {/* Name Content */}
            <div className="flex-1 min-w-0" onClick={() => !isOverlay && setIsEditing(true)}>
                {isEditing && !isOverlay ? (
                    <input
                        ref={inputRef}
                        value={nameVal}
                        onChange={(e) => setNameVal(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="w-full text-base font-medium text-gray-900 bg-transparent outline-none placeholder-gray-300"
                        placeholder="Category Name"
                    />
                ) : (
                    <div className="text-base font-medium text-gray-800 cursor-text truncate py-px">
                        {nameVal}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {!isOverlay && onToggleVisibility && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleVisibility()
                        }}
                        className={`
                            p-2 rounded-lg transition-colors
                            ${visible
                                ? "text-gray-400 hover:text-[#0f766e] hover:bg-[#0f766e]/10"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            }
                        `}
                        title={visible ? "Hide Category" : "Show Category"}
                    >
                        {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                )}

                {!isOverlay && onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        className="
                            p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 
                            rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100
                            transition-all duration-200
                        "
                        title="Delete Category"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}
