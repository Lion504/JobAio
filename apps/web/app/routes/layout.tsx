import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/auth-context'

import { FilterProvider } from '@/context/filter-context'

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <AuthProvider>
      <FilterProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar
              isCollapsed={isCollapsed}
              toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-hidden">
                <Outlet />
              </main>
            </div>
          </div>
        </ThemeProvider>
      </FilterProvider>
    </AuthProvider>
  )
}
