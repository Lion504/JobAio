import { Suspense, useEffect, useState } from 'react'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type LoaderFunctionArgs,
} from 'react-router'

import type { Route } from './+types/root'
import './app.css'
import i18n, {
  createLanguageCookie,
  detectRequestLanguage,
  ensureServerLanguage,
} from './i18n'
import { AuthProvider } from './context/auth-context'
import { BookmarksProvider } from './context/bookmarks-context'
import { DisclaimerBanner } from './components/disclaimer-banner'

export async function loader({ request }: LoaderFunctionArgs) {
  const lang = detectRequestLanguage(request)
  await ensureServerLanguage(lang)
  return new Response(JSON.stringify({ lang }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': createLanguageCookie(lang),
    },
  })
}

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { lang } = useLoaderData<typeof loader>()

  return (
    <html lang={lang ?? 'en'} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Suspense fallback={null}>{children}</Suspense>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const { lang } = useLoaderData<typeof loader>()
  const [ready, setReady] = useState(() => i18n.language === lang)

  useEffect(() => {
    let cancelled = false
    async function syncLanguage() {
      if (lang && i18n.language !== lang) {
        await i18n.changeLanguage(lang).catch(() => {})
      }
      if (!cancelled) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('jobaio-preferences-lang', lang)
            document.cookie = createLanguageCookie(lang)
          }
        } catch {
          // ignore
        }
        setReady(true)
      }
    }
    syncLanguage()
    return () => {
      cancelled = true
    }
  }, [lang])

  if (!ready) return null

  return (
    <AuthProvider>
      <BookmarksProvider>
        <Outlet />
        <DisclaimerBanner />
      </BookmarksProvider>
    </AuthProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
