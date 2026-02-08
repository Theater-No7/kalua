import { Coffee } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t border-border px-4 py-8 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-primary" strokeWidth={2.2} />
                    <span className="text-sm font-semibold text-primary">Kalua</span>
                </div>

                <p className="text-sm text-muted-foreground">
                    &copy; 2026 Kalua Project
                </p>

                <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                    GitHub
                </a>
            </div>
        </footer>
    )
}
