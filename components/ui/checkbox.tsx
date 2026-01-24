import * as React from "react"
import { cn } from "@/lib/utils"
// Simplified Checkbox without Radix UI
// We use a real input type="checkbox" but styled to look custom if possible, 
// or just a wrapper that handles the visuals. 
// However, the original code uses radix-like API likely, but looking at RecipeDetailScreen:
// <Checkbox checked={isChecked} onCheckedChange={...} />
// So it uses `onCheckedChange` instead of `onChange`.

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, ...props }, ref) => {
        return (
            <input
                type="checkbox"
                className={cn(
                    "peer h-4 w-4 shrink-0 rounded-sm border border-slate-200 border-slate-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 data-[state=checked]:text-slate-50",
                    className
                )}
                ref={ref}
                checked={checked}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                {...props}
            />
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
