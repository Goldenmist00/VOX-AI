import { cn } from "@/lib/utils"

type Props = {
  className?: string
  alt?: string
}

export function VoxAiSvgWordmark({ className, alt = "VOX AI wordmark" }: Props) {
  return (
    <img
      src="/images/vox-ai-wordmark.svg"
      alt={alt}
      className={cn("mx-auto block h-auto", className)}
      draggable={false}
    />
  )
}
