import { Link, type MetaFunction } from 'react-router'

import { Button } from '@/components/ui/button'

export const meta: MetaFunction = () => [
  { title: '404 - Not Found' },
  { name: 'description', content: 'Page not found' },
]

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">404</p>
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or was moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link to="/" prefetch="intent">
              Go back home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
