import { Compass } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <Compass className="h-5 w-5" strokeWidth={2.2} />
    </span>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
        Trove
      </span>
    </span>
  )
}
