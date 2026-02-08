"use client"

import React, { useState } from "react"
import { Plus, GripVertical, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CategorySettingsScreenProps {
    shopId: string
}

export function CategorySettingsScreen({ shopId }: CategorySettingsScreenProps) {
    const [categories, setCategories] = useState([
        { id: "1", name: "Coffee" },
        { id: "2", name: "Tea" },
        { id: "3", name: "Food" },
        { id: "4", name: "Morning" },
    ])
    const [newCategory, setNewCategory] = useState("")

    const handleAdd = () => {
        if (!newCategory) return
        setCategories([...categories, { id: Date.now().toString(), name: newCategory }])
        setNewCategory("")
    }

    const handleDelete = (id: string) => {
        setCategories(categories.filter(c => c.id !== id))
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* 上部: 追加フォーム */}
            <div className="p-4 border-b flex gap-2 bg-slate-50">
                <Input
                    placeholder="新しいカテゴリ名..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-white"
                />
                <Button onClick={handleAdd} className="bg-[#0f766e] hover:bg-[#0d9488] text-white">
                    <Plus className="w-4 h-4 mr-1" /> 追加
                </Button>
            </div>

            {/* リストエリア */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                    {categories.map((category) => (
                        <div key={category.id} className="group flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-teal-200">
                            <div className="flex items-center gap-3">
                                <div className="text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700">{category.name}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-teal-600">
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(category.id)} className="h-8 w-8 text-gray-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}