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
import { GripVertical, Trash2, Plus, Loader2 } from "lucide-react"
import { collection, query, orderBy, onSnapshot, doc, writeBatch, deleteDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Category {
    id: string
    name: string
    order: number
}

interface CategorySettingsScreenProps {
    shopId: string
    onBack?: () => void
}

export function CategorySettingsScreen({ shopId, onBack }: CategorySettingsScreenProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false) // 新規追加中かどうか

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px動かしたらドラッグ開始（クリックとの誤爆防止）
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // カテゴリ取得
    useEffect(() => {
        if (!shopId) return
        const q = query(collection(db, "stores", shopId, "categories"), orderBy("order", "asc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Category[]
            setCategories(cats)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [shopId])

    // ドラッグ開始
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    // ドラッグ終了（並び替えて保存）
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        setActiveId(null)

        if (over && active.id !== over.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id)
                const newIndex = items.findIndex(item => item.id === over.id)
                const newItems = arrayMove(items, oldIndex, newIndex)

                // 順番を再計算して保存
                saveOrder(newItems)

                return newItems
            })
        }
    }

    // 順序保存 (Batch Write)
    const saveOrder = async (items: Category[]) => {
        try {
            const batch = writeBatch(db)
            items.forEach((item, index) => {
                // orderが変わったものだけ更新するのが理想だが、安全のため全件更新でも許容範囲（数が少ないため）
                // しかし、今回は全件更新する
                const ref = doc(db, "stores", shopId, "categories", item.id)
                batch.update(ref, { order: index })
            })
            await batch.commit()
        } catch (error) {
            console.error("Failed to save order:", error)
        }
    }

    // 新規作成
    const handleAddCategory = async () => {
        setIsCreating(true)
        try {
            const newOrder = categories.length
            await addDoc(collection(db, "stores", shopId, "categories"), {
                name: "New Category",
                order: newOrder,
                createdAt: serverTimestamp()
            })
            // 追加されるとonSnapshotが反応してリストに追加される
        } catch (error) {
            console.error("Failed to add category:", error)
            alert("追加に失敗しました")
        } finally {
            setIsCreating(false)
        }
    }

    // 削除
    const handleDelete = async (id: string) => {
        if (!confirm("本当に削除しますか？\nこのカテゴリに属する商品は表示されなくなる可能性があります。")) return
        try {
            await deleteDoc(doc(db, "stores", shopId, "categories", id))
        } catch (error) {
            console.error("Failed to delete:", error)
            alert("削除に失敗しました")
        }
    }

    // 名前更新
    const handleUpdateName = async (id: string, newName: string) => {
        if (!newName.trim()) return // 空文字禁止
        try {
            await updateDoc(doc(db, "stores", shopId, "categories", id), {
                name: newName
            })
        } catch (error) {
            console.error("Failed to update name:", error)
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

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        ← Back
                    </button>
                ) : (
                    <div className="w-10"></div> // Spacer to keep title centered if desired, or remove
                )}
                <div className="text-center">
                    <h2 className="text-lg font-bold text-gray-800">Edit Categories</h2>
                    <p className="text-xs text-gray-400">ドラッグして並び替え</p>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 content-start"> {/* content-start で上詰め */}
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading...
                    </div>
                ) : (
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
                            <div className="space-y-3 pb-20"> {/* pb-20 for FAB space */}
                                {categories.map((category) => (
                                    <SortableItem
                                        key={category.id}
                                        category={category}
                                        onDelete={() => handleDelete(category.id)}
                                        onUpdateName={(name) => handleUpdateName(category.id, name)}
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
                )}
            </div>

            {/* Scale FAB */}
            <button
                onClick={handleAddCategory}
                disabled={isCreating}
                className="absolute bottom-6 right-6 w-14 h-14 bg-[#0f766e] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0d6560] transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100 z-10"
            >
                {isCreating ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Plus className="w-6 h-6 text-white" />}
            </button>
        </div>
    )
}

// ----------------------------------------------------
// Sub Components
// ----------------------------------------------------

interface SortableItemProps {
    category: Category
    onDelete: () => void
    onUpdateName: (name: string) => void
}

function SortableItem({ category, onDelete, onUpdateName }: SortableItemProps) {
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
        position: 'relative' as const, // Fix for z-index
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <ItemContent
                category={category}
                dragListeners={listeners}
                onDelete={onDelete}
                onUpdateName={onUpdateName}
            />
        </div>
    )
}

interface ItemContentProps {
    category: Category
    dragListeners?: any
    onDelete?: () => void
    onUpdateName?: (name: string) => void
    isOverlay?: boolean
}

function ItemContent({ category, dragListeners, onDelete, onUpdateName, isOverlay }: ItemContentProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [nameVal, setNameVal] = useState(category.name)
    const inputRef = useRef<HTMLInputElement>(null)

    // カテゴリ名が変わったら同期 (編集中以外)
    useEffect(() => {
        if (!isEditing) {
            setNameVal(category.name)
        }
    }, [category.name, isEditing])

    // 編集モードに入ったらフォーカス
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select() // 全選択でUX向上
        }
    }, [isEditing])

    const handleBlur = () => {
        setIsEditing(false)
        if (nameVal !== category.name && onUpdateName) {
            onUpdateName(nameVal)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleBlur()
        }
    }

    return (
        <div
            className={`
            group flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100
            ${isOverlay ? "shadow-2xl scale-105 border-emerald-500/30 ring-2 ring-emerald-500/20" : "hover:shadow-md hover:border-gray-200"}
            transition-all duration-200 select-none
        `}
        >
            {/* Drag Handle */}
            <div
                {...dragListeners}
                className="p-2 -ml-2 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg cursor-grab active:cursor-grabbing transition-colors touch-none"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            {/* Name Input / Display */}
            <div className="flex-1 min-w-0" onClick={() => !isOverlay && setIsEditing(true)}>
                {isEditing && !isOverlay ? (
                    <input
                        ref={inputRef}
                        value={nameVal}
                        onChange={(e) => setNameVal(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="w-full font-bold text-gray-800 bg-transparent outline-none border-b-2 border-[#0f766e] pb-1"
                    />
                ) : (
                    <div className="font-bold text-gray-800 cursor-text truncate">
                        {nameVal}
                    </div>
                )}
            </div>

            {/* Delete Button (Hover only, not on overlay) */}
            {!isOverlay && onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation() // 親のonClick発火防止
                        onDelete()
                    }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
