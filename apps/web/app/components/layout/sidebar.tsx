import { Link, useLocation } from 'react-router'
import {
  Settings,
  Bookmark,
  User,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ModeToggle } from '@/components/mode-toggle'
import { useTranslation } from 'react-i18next'

interface SidebarProps {
  isCollapsed?: boolean
  toggleCollapse?: () => void
  className?: string
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({
  isCollapsed = false,
  toggleCollapse,
  className,
  mobile = false,
  onClose,
}: SidebarProps) {
  const location = useLocation()
  const { t } = useTranslation()

  const navItems = [
    { icon: Briefcase, label: t('sidebar.jobs'), href: '/' },
    { icon: Sparkles, label: t('sidebar.suggestions'), href: '/suggestions' },
    { icon: BarChart3, label: 'Market Insights', href: '/insights' },
    { icon: Bookmark, label: t('sidebar.saved'), href: '/saved' },
    { icon: Settings, label: t('sidebar.preferences'), href: '/preferences' },
  ]

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-card/20 relative overflow-hidden',
        !mobile && 'border-r',
        className
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b px-3 z-10',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span>JobAio</span>
          </Link>
        )}

        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleCollapse}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}

        {mobile && onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">{t('common.closeSidebar')}</span>
          </Button>
        )}
      </div>

      <div className="flex-1 py-4 z-10">
        <nav className="grid gap-1 px-2">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    onClick={mobile ? onClose : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      location.pathname === item.href
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground',
                      isCollapsed && 'justify-center px-2'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </div>

      <div className="border-t p-2 z-10">
        <div
          className={cn(
            'flex items-center gap-2',
            isCollapsed ? 'flex-col justify-center' : 'justify-between px-2'
          )}
        >
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                  <Link to="/account">
                    <User className="h-4 w-4" />
                    <span className="sr-only">{t('sidebar.account')}</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  {t('sidebar.account')}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {!isCollapsed && (
            <Link to="/account" className="text-sm font-medium hover:underline">
              {t('sidebar.account')}
            </Link>
          )}

          <ModeToggle />
        </div>
      </div>
    </div>
  )
}
