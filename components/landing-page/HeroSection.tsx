import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
    return (
        <section className="px-4 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-20">
            <div className="mx-auto max-w-6xl text-center">
                <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                    {"キッチンの「言った・言わない」に、さようなら。"}
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
                    {"小規模カフェのためのレシピ・マニュアル管理アプリ。教育コストを削減し、最高の一杯に集中できる環境を。"}
                </p>

                <Link href="/dashboard">
                    <Button
                        size="lg"
                        className="rounded-full bg-primary px-10 py-6 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                    >
                        {"デモを試す"}
                    </Button>
                </Link>

                <div className="relative mx-auto mt-14 max-w-3xl">
                    <div className="absolute -inset-4 rounded-3xl bg-primary/5" />
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
                        <Image
                            src="/lp-image/hero-phone.png"
                            alt="カフェでKaluaのレシピ管理アプリを表示しているタブレット"
                            width={1200}
                            height={750}
                            className="h-auto w-full"
                            priority
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
