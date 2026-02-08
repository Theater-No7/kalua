import { Globe, Database, Cpu, Users } from "lucide-react"

const techItems = [
    {
        name: "Next.js",
        detail: "App Router",
        Icon: Globe,
    },
    {
        name: "Firebase",
        detail: "Auth & Firestore",
        Icon: Database,
    },
    {
        name: "Go",
        detail: "バックエンドバッチ処理",
        Icon: Cpu,
    },
    {
        name: "HCI/UXデザイン",
        detail: "人間中心設計",
        Icon: Users,
    },
]

export function TechStackSection() {
    return (
        <section className="bg-[hsl(215,25%,12%)] px-4 py-16 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-6xl text-center">
                <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {"モダンな技術で構築"}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-slate-400">
                    {"信頼性、速度、そして優れたユーザー体験を実現するために、厳選した技術スタックを採用しています。"}
                </p>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {techItems.map((item) => (
                        <div
                            key={item.name}
                            className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-[hsl(174,78%,26%)]/40 hover:bg-white/10"
                        >
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(174,78%,26%)]/15">
                                <item.Icon
                                    className="h-6 w-6 text-[hsl(174,60%,55%)]"
                                    strokeWidth={1.8}
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                            <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
