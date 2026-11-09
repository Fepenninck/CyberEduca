import type { ReactNode } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#080d18] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-64">
        <AdminHeader />
        <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
