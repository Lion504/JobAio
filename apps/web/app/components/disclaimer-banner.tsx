import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'jobaio-disclaimer-dismissed-v1'

export function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(DISMISS_KEY)
      setIsVisible(stored !== 'true')
    } catch (error) {
      console.error('Failed to read disclaimer state from localStorage', error)
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch (error) {
      console.error('Failed to persist disclaimer dismissal', error)
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-4 z-50 flex justify-center sm:inset-x-6">
      <div className="pointer-events-auto flex w-full max-w-4xl items-start gap-3 rounded-lg border bg-card p-4 shadow-lg">
        <AlertCircle
          className="mt-0.5 h-5 w-5 text-amber-500"
          aria-hidden="true"
        />
        <div className="flex-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Disclaimer</p>
          <p>
            We are not responsible for outdated or inaccurate job listings.
            Always check the original listing.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={handleDismiss}
          aria-label="Dismiss disclaimer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
