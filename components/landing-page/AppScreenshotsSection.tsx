"use client"

import { useState } from "react"
import Image from "next/image"
import { ShieldCheck, UserRound } from "lucide-react"

const tabs = [
    {
        id: "owner",
        label: "オーナー用画面",
        Icon: ShieldCheck,
        images: [
            {
                src: "/lp-image/owner-dashboard.png",
                alt: "オーナー向けダッシュボード - レシピ一覧と進捗管理",
                caption: "ダッシュボード",
            },
            {
                src: "/lp-image/owner-recipe-edit.png",
                alt: "オーナー向けレシピ編集画面",
                caption: "レシピ編集",
            },
            {
                src: "/lp-image/owner-staff-management.png",
                alt: "オーナー向けスタッフ管理・既読確認画面",
                caption: "スタッフ管理・既読確認",
            },
        ],
    },
    {
        id: "staff",
        label: "スタッフ用画面",
        Icon: UserRound,
        images: [
            {
                src: "/lp-image/staff-recipe-list.png",
                alt: "スタッフ向けレシピ一覧画面",
                caption: "レシピ一覧",
            },
            {
                src: "/lp-image/staff-recipe-detail.png",
                alt: "スタッフ向けレシピ詳細・手順確認画面",
                caption: "レシピ詳細",
            },
            {
                src: "/lp-image/staff-notifications.png",
                alt: "スタッフ向け通知画面",
                caption: "通知一覧",
            },
        ],
    },
]

export function AppScreenshotsSection() {
    const [activeTab, setActiveTab] = useState("owner")

    const activeData = tabs.find((t) => t.id === activeTab)

    return (
        <section className="bg-card px-4 py-16 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-6xl">
                <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {"Kaluaの操作画面"}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-center text-pretty text-base leading-relaxed text-muted-foreground">
                    {"オーナーとスタッフ、それぞれに最適化された画面で、現場の運用をスムーズにします。"}
                </p>

                <div className="mt-10 flex items-center justify-center gap-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${activeTab === tab.id
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            <tab.Icon className="h-4 w-4" strokeWidth={2} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeData && (
                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {activeData.images.map((img) => (
                            <div
                                key={img.src}
                                className="group overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all hover:shadow-md hover:shadow-primary/5"
                            >
                                <div
                                    className={`relative overflow-hidden bg-muted ${activeTab === "owner" ? "aspect-4/3" : "aspect-9/16"
                                        }`}
                                >
                                    <Image
                                        src={img.src || "/placeholder.svg"}
                                        alt={img.alt}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                </div>
                                <div className="px-5 py-4">
                                    <p className="text-sm font-semibold text-foreground">
                                        {img.caption}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
