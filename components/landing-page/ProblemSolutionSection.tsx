import { Smartphone, Bell, CheckCircle2 } from "lucide-react"

const items = [
    {
        problem: "紙のマニュアルは汚れて、なくなる。",
        solution: "いつでも清潔、いつでもデジタル。",
        Icon: Smartphone,
    },
    {
        problem: "更新が全員に届かない。",
        solution: "リアルタイム通知で全スタッフに即共有。",
        Icon: Bell,
    },
    {
        problem: "誰が新しいレシピを読んだ？",
        solution: "既読確認でトレーニング進捗を把握。",
        Icon: CheckCircle2,
    },
]

export function ProblemSolutionSection() {
    return (
        <section className="px-4 py-16 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-6xl">
                <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {"こんな課題、ありませんか？"}
                </h2>
                <div className="grid gap-8 md:grid-cols-3">
                    {items.map((item) => (
                        <div
                            key={item.problem}
                            className="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                        >
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
                                <item.Icon
                                    className="h-7 w-7 text-accent-foreground"
                                    strokeWidth={1.8}
                                />
                            </div>

                            <div className="mb-4">
                                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                    {"課題"}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-foreground">
                                    {item.problem}
                                </p>
                            </div>

                            <div className="border-t border-border pt-4">
                                <p className="text-sm font-medium uppercase tracking-wide text-primary">
                                    {"解決策"}
                                </p>
                                <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                                    {item.solution}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
