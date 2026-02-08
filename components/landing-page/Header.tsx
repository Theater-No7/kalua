"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 border-b border-green/10 bg-primary shadow-md backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <div className="relative h-12 w-40 md:h-20 md:w-64">
                        <Image
                            src="/kalua_white-removebg.png"
                            alt="Kalua Logo"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </Link>

                <Link href="https://kalua-app.vercel.app/">
                    <Button
                        size="lg"
                        className="hidden rounded-full bg-white text-primary hover:bg-white/90 font-bold shadow-sm sm:inline-flex"
                    >
                        {"デモを試す（ログイン不要）"}
                    </Button>
                </Link>

                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md p-2 text-primary-foreground hover:bg-primary-foreground/10 sm:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
                >
                    {mobileMenuOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="border-t border-white/10 px-4 py-4 sm:hidden bg-primary">
                    <Button
                        size="lg"
                        className="w-full rounded-full bg-white text-primary hover:bg-white/90 font-bold"
                    >
                        {"デモを試す（ログイン不要）"}
                    </Button>
                </div>
            )}
        </header>
    )
}