"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

// Simple DropdownMenu implementation using Context

interface DropdownContextType {
    open: boolean
    setOpen: (open: boolean) => void
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined)

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Click outside to close
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    return (
        <DropdownContext.Provider value={{ open, setOpen }}>
            <div ref={containerRef} className="relative inline-block text-left">
                {children}
            </div>
        </DropdownContext.Provider>
    )
}

export const DropdownMenuTrigger = ({ children, className, asChild }: { children: React.ReactNode, className?: string, asChild?: boolean }) => {
    const { open, setOpen } = React.useContext(DropdownContext)!

    // If asChild is true, we should strictly clone the element and add onClick,
    // but for simplicity we'll just wrap or clone if possible.
    // The codebase uses asChild on Button.

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, { // Cast to any to avoid partial prop error
            onClick: (e: React.MouseEvent) => {
                (children as any).props.onClick?.(e)
                setOpen(!open)
            }
        })
    }

    return (
        <button
            onClick={() => setOpen(!open)}
            className={className}
        >
            {children}
        </button>
    )
}

export const DropdownMenuContent = ({ children, align = "center", className }: { children: React.ReactNode, align?: "start" | "end" | "center", className?: string }) => {
    const { open } = React.useContext(DropdownContext)!
    if (!open) return null

    const alignClass = align === "end" ? "right-0" : align === "start" ? "left-0" : "left-1/2 -translate-x-1/2"

    return (
        <div className={cn(
            "absolute z-50 mt-2 min-w-32 overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md",
            alignClass,
            className
        )}>
            {children}
        </div>
    )
}

export const DropdownMenuItem = ({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) => {
    const { setOpen } = React.useContext(DropdownContext)!

    return (
        <div
            onClick={() => {
                onClick?.()
                setOpen(false)
            }}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 data-disabled:pointer-events-none data-disabled:opacity-50",
                className
            )}
        >
            {children}
        </div>
    )
}

export const DropdownMenuSeparator = ({ className }: { className?: string }) => (
    <div className={cn("-mx-1 my-1 h-px bg-slate-100", className)} />
)
