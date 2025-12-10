import { Link, useLocation } from 'react-router'
import {
  Settings,
  Bookmark,
  User,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTranslation } from 'react-i18next'
import { Canvas } from '@react-three/fiber'
import { Effect } from '../VisualEffects'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef, forwardRef } from 'react'

interface SidebarProps {
  isCollapsed?: boolean
  toggleCollapse?: () => void
  className?: string
  mobile?: boolean
  onClose?: () => void
}

const SidebarItem = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  {
    isActive?: boolean
    isCollapsed?: boolean
    icon?: React.ElementType
    label?: string
    to?: string
    className?: string
    children?: React.ReactNode
    onClick?: React.MouseEventHandler
    prefetch?: string
  } & React.HTMLAttributes<HTMLElement>
>(
  (
    {
      className,
      isActive,
      isCollapsed,
      icon: Icon,
      label,
      children,
      to,
      ...props
    },
    ref
  ) => {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [opacity, setOpacity] = useState(0)
    const localRef = useRef<HTMLElement>(null)

    // Merge refs logic
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(localRef.current as HTMLAnchorElement | HTMLButtonElement | null)
      } else if (ref) {
        ;(
          ref as React.MutableRefObject<
            HTMLAnchorElement | HTMLButtonElement | null
          >
        ).current = localRef.current as
          | HTMLAnchorElement
          | HTMLButtonElement
          | null
      }
    }, [ref])

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
      if (!localRef.current) return
      const rect = localRef.current.getBoundingClientRect()
      setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    const handleMouseEnter = () => setOpacity(1)
    const handleMouseLeave = () => setOpacity(0)

    const Comp = to ? Link : 'button'

    return (
      <Comp
        // @ts-expect-error: Dynamic component props mismatch, to is only valid for Link
        to={to}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={localRef as any}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 overflow-hidden group w-full',
          isActive
            ? 'text-foreground shadow-xl bg-transparent'
            : 'text-muted-foreground hover:text-foreground',
          isCollapsed && 'justify-center px-2',
          className
        )}
        {...props}
      >
        {/* Background Layers */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            isActive
              ? 'opacity-100 bg-accent/60 backdrop-blur-xl border border-white/13 shadow-lg'
              : 'opacity-0 group-hover:opacity-100 bg-accent/30 backdrop-blur-md border border-white/10'
          )}
        />

        {/* Liquid / Glow Effects */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(160px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.15), transparent 60%)`,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(70px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.35), transparent 50%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3 w-full">
          {Icon && (
            <Icon className="h-4 w-4 shrink-0 transition-transform duration-300" />
          )}
          {!isCollapsed && label && <span className="truncate">{label}</span>}
          {children}
        </div>
      </Comp>
    )
  }
)
SidebarItem.displayName = 'SidebarItem'

export function Sidebar({
  isCollapsed = false,
  toggleCollapse,
  className,
  mobile = false,
  onClose,
}: SidebarProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const [scope, setScope] = useState<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLight = mounted && resolvedTheme === 'light'

  const navItems = [
    { icon: Briefcase, label: t('sidebar.jobs'), href: '/' },
    { icon: Sparkles, label: t('sidebar.suggestions'), href: '/suggestions' },
    { icon: Bookmark, label: t('sidebar.saved'), href: '/saved' },
    { icon: Settings, label: t('sidebar.preferences'), href: '/preferences' },
  ]

  return (
    <div
      ref={setScope}
      className={cn(
        'flex h-full flex-col bg-card/20 relative overflow-hidden backdrop-blur-xl',
        !mobile && 'border-r',
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
        <Canvas eventSource={scope || undefined} eventPrefix="client">
          <Effect isLightMode={isLight} />
        </Canvas>
      </div>

      <div
        className={cn(
          'flex h-14 items-center border-b px-3 z-10 bg-background/5',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!isCollapsed && (
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold group relative px-2 py-1 rounded-md overflow-hidden"
          >
            {/* Simple glow for title too? Optional but nice */}
            <span className="relative z-10">JobAio</span>
          </Link>
        )}

        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-accent/20"
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
        <nav className="grid gap-2 px-2">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <SidebarItem
                    to={item.href}
                    prefetch="intent"
                    onClick={mobile ? onClose : undefined}
                    isActive={location.pathname === item.href}
                    isCollapsed={isCollapsed}
                    icon={item.icon}
                    label={item.label}
                  />
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
            'grid gap-1', // Changed logic to grid for consistent spacing
            isCollapsed ? 'justify-center' : 'px-0'
          )}
        >
          {/* Account Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarItem
                  to="/account"
                  prefetch="intent"
                  isCollapsed={isCollapsed}
                  icon={User}
                  label={t('sidebar.account')}
                />
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  {t('sidebar.account')}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* Theme Toggle Button */}
          <TooltipProvider delayDuration={0}>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <SidebarItem
                      isCollapsed={isCollapsed}
                      icon={isLight ? Sun : Moon} // Dynamic icon
                      label={t('theme.toggle')} // Assuming typical t key, or use "Theme"
                    />
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    {t('theme.toggle')}
                  </TooltipContent>
                )}
              </Tooltip>
              <DropdownMenuContent
                align={isCollapsed ? 'center' : 'start'}
                side={isCollapsed ? 'right' : 'top'}
              >
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
