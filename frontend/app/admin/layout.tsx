import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import './admin.css'

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div data-admin-shell className="admin-workspace">
      <AdminSidebar />
      <div className="admin-workspace-body">
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}
