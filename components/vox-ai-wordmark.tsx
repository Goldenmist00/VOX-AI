import { cn } from "@/lib/utils"

type Props = {
  className?: string
  alt?: string
}

export function VoxAiWordmark({ className, alt = "VOX AI wordmark" }: Props) {
  return (
    <img
      src="/images/vox-ai-wordmark.svg"
      alt={alt}
      className={cn("mx-auto block h-auto w-[min(90vw,900px)]", "select-none", className)}
      draggable={false}
    />
  )
}
