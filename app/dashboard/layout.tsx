import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - VOX AI',
  description: 'Public Insight Dashboard - Where NGOs and Policymakers turn collective public voice into real-world action',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}