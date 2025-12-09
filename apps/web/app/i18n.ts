import i18n, { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

import deTranslations from './locales/de/translation.json'
import enTranslations from './locales/en/translation.json'
import esTranslations from './locales/es/translation.json'
import fiTranslations from './locales/fi/translation.json'
import frTranslations from './locales/fr/translation.json'
import svTranslations from './locales/sv/translation.json'
import zhTranslations from './locales/zh/translation.json'

const isBrowser = typeof window !== 'undefined'
const defaultLng = 'en'
const supportedLngs = ['en', 'fi', 'zh', 'sv', 'es', 'fr', 'de']
const LANGUAGE_COOKIE = 'jobaio-preferences-lang'

const resources = {
  de: { translation: deTranslations },
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fi: { translation: fiTranslations },
  fr: { translation: frTranslations },
  sv: { translation: svTranslations },
  zh: { translation: zhTranslations },
}

i18n.use(initReactI18next)

i18n.init({
  lng: defaultLng,
  fallbackLng: defaultLng,
  supportedLngs,
  defaultNS: 'translation',
  debug: import.meta.env.DEV && isBrowser,
  interpolation: {
    escapeValue: false,
  },

  resources,
  react: {
    useSuspense: false,
  },
})

/**
 * Apply client-preferred language after hydration to avoid SSR/CSR mismatch.
 */
export function applyClientLanguagePreference() {
  if (!isBrowser) return

  const stored = localStorage.getItem(LANGUAGE_COOKIE)
  const navigatorLang = navigator?.language?.split('-')?.[0]
  const preferred = stored || navigatorLang || defaultLng

  if (preferred && preferred !== i18n.language) {
    i18n.changeLanguage(preferred).catch(() => {})
  }
}

export function detectRequestLanguage(request: Request): string {
  const url = new URL(request.url)
  const langFromQuery = url.searchParams.get('lang')
  if (langFromQuery && supportedLngs.includes(langFromQuery))
    return langFromQuery

  const cookie = request.headers.get('cookie') || ''
  const cookieMatch = cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${LANGUAGE_COOKIE}=`))
  if (cookieMatch) {
    const value = cookieMatch.split('=')[1]
    if (supportedLngs.includes(value)) return value
  }

  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(',')
      .map((part) => part.split(';')[0]?.trim())
      .find((lng) => supportedLngs.includes(lng))
    if (preferred) return preferred
  }

  return defaultLng
}

export function createLanguageCookie(lang: string) {
  const sanitized = supportedLngs.includes(lang) ? lang : defaultLng
  const maxAge = 60 * 60 * 24 * 365 // 1 year
  return `${LANGUAGE_COOKIE}=${sanitized}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

export async function ensureServerLanguage(lang: string) {
  const sanitized = supportedLngs.includes(lang) ? lang : defaultLng
  if (i18n.isInitialized && i18n.language === sanitized) return
  await i18n.changeLanguage(sanitized)
}

export function createIsolatedI18n(lang: string) {
  const sanitized = supportedLngs.includes(lang) ? lang : defaultLng
  const instance = createInstance()
  instance.use(initReactI18next)
  instance.init({
    lng: sanitized,
    fallbackLng: defaultLng,
    supportedLngs,
    resources,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
  return instance
}

export { supportedLngs, defaultLng, LANGUAGE_COOKIE }
export default i18n
