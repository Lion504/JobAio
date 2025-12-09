import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

import { FilterProvider } from '@/context/filter-context'
import { useTranslation } from 'react-i18next'

export default function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const currentLang = params.get('lang')
    if (currentLang === i18n.language) return
    params.set('lang', i18n.language)
    const search = params.toString()
    navigate(`${location.pathname}?${search}`, { replace: true })
  }, [i18n.language, location.pathname, location.search, navigate])

  return (
    <FilterProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex"
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
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
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  App navigation menu
                </SheetDescription>
                <Sidebar mobile onClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </Header>
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </FilterProvider>
  )
}
