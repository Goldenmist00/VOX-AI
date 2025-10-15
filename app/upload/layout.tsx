import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upload & Analyze - VOX AI',
  description: 'Upload transcripts or documents and get AI-generated insights, summaries, and sentiment analysis',
}

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}