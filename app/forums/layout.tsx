import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forums - VOX AI',
  description: 'Join real-time debates and see collective opinion evolve through AI insights',
}

export default function ForumsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}