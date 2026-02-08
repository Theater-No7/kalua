"use client"

import React, { useState, useEffect } from "react"
import {
    Settings, Store, Users, Copy, Eye, EyeOff, RefreshCw, LogOut, AlertTriangle, X, Trash2
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ShopSettingsModalProps {
    isOpen: boolean
    onClose: () => void
    shopId: string
    onLogout?: () => void
}

interface Member {
    id: number
    name: string
    role: "Owner" | "Staff"
    image?: string
}

export function ShopSettingsModal({ isOpen, onClose, shopId, onLogout }: ShopSettingsModalProps) {
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState("general")

    // フォーム用ステート (モック)
    const [shopName, setShopName] = useState("Kalua Demo Shop")
    const [shopDescription, setShopDescription] = useState("Welcome to our cozy cafe!")
    const [passcode, setPasscode] = useState("1234")
    const [showPasscode, setShowPasscode] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // メンバー管理用ステート (モック)
    const [members, setMembers] = useState<Member[]>([
        { id: 1, name: "Reo Sato", role: "Owner" },
        { id: 2, name: "Tabasa", role: "Staff" }
    ])

    // 変更検知 (モック)
    useEffect(() => {
        const isChanged = shopName !== "Kalua Demo Shop"
        setHasChanges(isChanged)
    }, [shopName])

    const handleCopyId = () => {
        navigator.clipboard.writeText(shopId)
        toast({ title: "Copied!", description: "Shop ID copied to clipboard." })
    }

    const handleSave = () => {
        setHasChanges(false)
        toast({ title: "Saved", description: "Shop settings updated." })
    }

    const handleRemoveMember = (id: number) => {
        setMembers(members.filter(m => m.id !== id))
        toast({ title: "Member removed", description: "The staff member has been removed from the shop." })
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white/95 backdrop-blur-xl border-teal-100/50 shadow-2xl rounded-2xl">

                {/* ヘッダーエリア */}
                <div className="p-6 pb-4 border-b border-teal-100 bg-teal-50/30 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0f766e] flex items-center justify-center text-white shadow-lg shadow-teal-900/10">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-teal-900">ショップ設定</DialogTitle>
                            <p className="text-sm text-teal-600/80 font-medium">店舗の設定を管理します</p>
                        </div>
                    </div>
                    {/* 閉じるボタン */}
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* タブエリア */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-2 bg-teal-50/30 border-b border-teal-100">
                        <TabsList className="bg-teal-100/50 p-1 rounded-xl w-full justify-start h-auto gap-1">
                            <TabsTrigger value="general" className="capitalize rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0f766e] data-[state=active]:shadow-sm px-4 py-2 text-sm">一般</TabsTrigger>
                            <TabsTrigger value="access" className="capitalize rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0f766e] data-[state=active]:shadow-sm px-4 py-2 text-sm">アクセス</TabsTrigger>
                            <TabsTrigger value="members" className="capitalize rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0f766e] data-[state=active]:shadow-sm px-4 py-2 text-sm">メンバー</TabsTrigger>
                            <TabsTrigger value="advanced" className="capitalize rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0f766e] data-[state=active]:shadow-sm px-4 py-2 text-sm">詳細</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50/50">

                        {/* 1. General Tab */}
                        <TabsContent value="general" className="p-6 space-y-6 mt-0">
                            <div className="space-y-4">
                                <Label>ショップアイコン</Label>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-md">
                                        <Store className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <Button variant="outline">アイコン変更</Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>ショップ名</Label>
                                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>説明</Label>
                                <Textarea value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} />
                            </div>
                            <Button onClick={handleSave} disabled={!hasChanges} className="w-full bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold">
                                変更を保存
                            </Button>
                        </TabsContent>

                        {/* 2. Access Tab */}
                        <TabsContent value="access" className="p-6 space-y-6 mt-0">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-700">
                                <Users className="w-5 h-5 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm">スタッフを招待</h4>
                                    <p className="text-xs opacity-90">ショップIDとパスコードをスタッフに共有してください。</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>ショップID</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-10 bg-gray-100 rounded-md flex items-center px-3 font-mono text-sm border select-all">{shopId}</div>
                                    <Button size="icon" onClick={handleCopyId}><Copy className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>パスコード</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-10 bg-white rounded-md flex items-center px-3 font-mono text-lg border relative">
                                        {showPasscode ? passcode : "••••"}
                                        <button onClick={() => setShowPasscode(!showPasscode)} className="absolute right-3 text-gray-400">
                                            {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <Button variant="outline" onClick={() => setPasscode(Math.floor(1000 + Math.random() * 9000).toString())}>
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 3. Members Tab */}
                        <TabsContent value="members" className="p-6 mt-0">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold text-gray-700">現在の参加メンバー</Label>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{members.length} users</span>
                                </div>

                                <div className="grid gap-3">
                                    {members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-gray-100">
                                                    <AvatarImage src={member.image} alt={member.name} />
                                                    <AvatarFallback className="bg-teal-50 text-teal-700 font-medium">
                                                        {getInitials(member.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.role === 'Owner'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-teal-50 text-teal-700'
                                                        }`}>
                                                        {member.role}
                                                    </span>
                                                </div>
                                            </div>

                                            {member.role !== 'Owner' && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 hover:bg-red-50">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>本当に削除してよろしいですか？</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                この操作は取り消せません。スタッフ <b>{member.name}</b> をショップから削除します。
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleRemoveMember(member.id)}
                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                            >
                                                                削除する
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* 4. Advanced Tab */}
                        <TabsContent value="advanced" className="p-6 space-y-6 mt-0">
                            <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                                <div><p className="font-medium">サインアウト</p></div>
                                <Button variant="outline" onClick={onLogout} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                    <LogOut className="w-4 h-4 mr-2" />ログアウト
                                </Button>
                            </div>
                            <div className="p-4 rounded-xl border border-red-100 bg-red-50">
                                <p className="font-bold text-red-900 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> 危険エリア
                                </p>
                                <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700">ショップデータを削除</Button>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}