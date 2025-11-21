import { useState } from 'react'
import { Outlet } from 'react-router'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

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
              className="hidden lg:flex"
            />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header>
                <Sheet open={isCollapsed} onOpenChange={setIsCollapsed}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden -ml-2"
                    >
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-[280px]">
                    <Sidebar
                      mobile
                      onClose={() => setIsCollapsed(false)}
                    />
                  </SheetContent>
                </Sheet>
              </Header>
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
