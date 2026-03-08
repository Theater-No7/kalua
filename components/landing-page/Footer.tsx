import Image from "next/image"

export function Footer() {
    return (
        <footer className="border-t border-border px-4 py-1 lg:px-4">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-2">
                    <Image
                        src="/kalua_white-removebg.png"
                        alt="Kalua Logo"
                        width={100}
                        height={60}
                        className="object-contain object-left invert dark:invert-0"
                        priority
                    />
                </div>

                <p className="text-sm text-muted-foreground">
                    &copy; 2026 Kalua Project
                </p>

                <a
                    href="https://github.com/Theater-No7/kalua"
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
