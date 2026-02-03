"use client"
import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple Select implementation using Context
// Not fully accessible like Radix, but functional for now

interface SelectContextType {
    value: string
    onValueChange: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
    label: string
    setLabel: (label: string) => void
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

export const Select = ({ children, value, onValueChange }: { children: React.ReactNode, value: string, onValueChange: (val: string) => void }) => {
    const [open, setOpen] = React.useState(false)
    const [titleLabel, setTitleLabel] = React.useState("")

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen, label: titleLabel, setLabel: setTitleLabel }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

export const SelectTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { open, setOpen } = React.useContext(SelectContext)!
    return (
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
}

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const { value, label } = React.useContext(SelectContext)!
    return <span>{label || value || placeholder}</span>
}

export const SelectContent = ({ children }: { children: React.ReactNode }) => {
    const { open } = React.useContext(SelectContext)!
    if (!open) return null
    return (
        <div className="absolute top-full z-50 mt-1 max-h-96 w-full min-w-32 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md">
            <div className="p-1">{children}</div>
        </div>
    )
}

export const SelectItem = ({ children, value, className }: { children: React.ReactNode, value: string, className?: string }) => {
    const { onValueChange, setOpen, setLabel, value: selectedValue } = React.useContext(SelectContext)!

    // Update label if selected
    React.useEffect(() => {
        if (value === selectedValue) {
            setLabel(children as string)
        }
    }, [value, selectedValue, children, setLabel])

    return (
        <div
            onClick={() => {
                onValueChange(value)
                setLabel(children as string)
                setOpen(false)
            }}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 data-disabled:pointer-events-none data-disabled:opacity-50",
                className
            )}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {/* Indicator could go here */}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
}
