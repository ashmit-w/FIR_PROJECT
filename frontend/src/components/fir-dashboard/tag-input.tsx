"use client"

import type React from "react"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

type Props = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  "aria-label"?: string
}

export default function TagInput({ value, onChange, placeholder, "aria-label": ariaLabel }: Props) {
  const [input, setInput] = useState("")

  const addTag = (raw: string) => {
    const tag = raw.trim()
    if (!tag) return
    if (value.includes(tag)) return
    onChange([...value, tag])
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(input)
      setInput("")
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      // remove last
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="w-full rounded-md border border-input bg-background px-2 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
              "bg-accent text-accent-foreground",
            )}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:opacity-80"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          aria-label={ariaLabel}
          className="flex-1 bg-transparent px-2 py-1 text-sm outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
