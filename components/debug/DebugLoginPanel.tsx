"use client"

import React, { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Shield, User, LogOut, GripHorizontal, Minimize2, Maximize2 } from "lucide-react"

export function DebugLoginPanel() {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return null

    const { user, role, loginAsDebugUser, logout } = useAuth()

    // State
    const [isMinimized, setIsMinimized] = useState(true)
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 80 }) // Initial: Left-Bottomish
    const [isDragging, setIsDragging] = useState(false)
    const dragStartPos = useRef({ x: 0, y: 0 })
    const panelStartPos = useRef({ x: 0, y: 0 })

    // Adjust initial position to client side only to avoid hydration mismatch if needed
    // But fixed position is fine. Let's rely on standard state.
    // To position at bottom left initially: 
    // We can use bottom/left CSS and transform, OR absolute positioning.
    // Absolute/Fixed positioning with top/left is easiest for dragging.

    // Initialize position on mount
    useEffect(() => {
        setPosition({ x: 20, y: window.innerHeight - 100 })
    }, [])

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault() // User text selection prevention
        setIsDragging(true)
        dragStartPos.current = { x: e.clientX, y: e.clientY }
        panelStartPos.current = { ...position }
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return

            const dx = e.clientX - dragStartPos.current.x
            const dy = e.clientY - dragStartPos.current.y

            setPosition({
                x: panelStartPos.current.x + dx,
                y: panelStartPos.current.y + dy
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    // Render Minimized (Icon)
    if (isMinimized) {
        return (
            <div
                className="fixed z-50 cursor-move transition-opacity hover:opacity-100 opacity-50"
                style={{ left: position.x, top: position.y }}
                onMouseDown={handleMouseDown}
            >
                <button
                    onClick={(e) => {
                        // Prevent click if we dragged
                        // Actually, simple click vs drag distinction might be nice but 
                        // for now let's just assume local click if drag was small?
                        // Or just click handler fires if mouseup happened quickly/nearby.
                        // But we are on the parent div for mousedown.
                        // Let's put click on the button, but mousedown on the wrapper? 
                        // If wrapper moves, it's a drag.
                        // Let's keep it simple: Click toggles. Drag moves.
                        if (!isDragging) setIsMinimized(false)
                    }}
                    className="w-12 h-12 bg-black/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 select-none animate-in fade-in zoom-in duration-200"
                    title="Open Debug Panel"
                >
                    <span className="text-xl">🐞</span>
                </button>
            </div>
        )
    }

    // Render Expanded
    return (
        <div
            className="fixed z-50 bg-black/80 backdrop-blur-md text-white rounded-xl shadow-2xl border border-white/10 text-xs w-64 animate-in fade-in zoom-in duration-200 overflow-hidden"
            style={{ left: position.x, top: position.y }}
        >
            {/* Header (Drag Handle) */}
            <div
                className="bg-white/5 p-2 flex items-center justify-between cursor-move select-none border-b border-white/5"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2 font-bold text-gray-400">
                    <GripHorizontal className="w-4 h-4 text-gray-500" />
                    <span>DEBUG AUTH</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="bg-yellow-500/20 text-yellow-500 px-1.5 rounded uppercase text-[10px]">Dev</span>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="ml-2 hover:bg-white/10 p-1 rounded transition-colors"
                        onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                    >
                        <Minimize2 className="w-3 h-3 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col gap-3">
                {user ? (
                    <div className="p-2 bg-white/10 rounded flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${role === 'OWNER' ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-white'}`}>
                            {role === 'OWNER' ? 'O' : 'S'}
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-bold text-sm">{role}</div>
                            <div className="text-gray-400 leading-none truncate w-full text-[10px]">{user.uid}</div>
                        </div>
                    </div>
                ) : (
                    <div className="p-2 text-gray-500 italic text-center bg-white/5 rounded border border-dashed border-gray-600">
                        Not logged in
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => loginAsDebugUser("OWNER", "debug-owner-001")}
                        className="flex flex-col items-center justify-center gap-1 p-2 bg-purple-500/10 hover:bg-purple-500/30 text-purple-200 rounded-lg transition-colors border border-purple-500/20"
                    >
                        <Shield className="w-4 h-4 mb-0.5" />
                        <span className="font-bold">Owner</span>
                    </button>
                    <button
                        onClick={() => loginAsDebugUser("STAFF", "debug-staff-001")}
                        className="flex flex-col items-center justify-center gap-1 p-2 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-200 rounded-lg transition-colors border border-emerald-500/20"
                    >
                        <User className="w-4 h-4 mb-0.5" />
                        <span className="font-bold">Staff</span>
                    </button>
                </div>

                {user && (
                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-2 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg transition-colors w-full border border-red-500/20"
                    >
                        <LogOut className="w-3 h-3" />
                        Logout
                    </button>
                )}
            </div>
        </div>
    )
}
