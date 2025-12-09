import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const isServer = typeof window === 'undefined'

async function initializeI18n() {
  if (isServer) {
    // Server-side: preload translations synchronously
    const { readFileSync } = await import('fs')
    const { join } = await import('path')

    // Preload English translations
    const enTranslations = JSON.parse(
      readFileSync(
        join(process.cwd(), '/public/locales/en/translation.json'),
        'utf-8'
      )
    )

    await i18n.use(initReactI18next).init({
      fallbackLng: 'en',
      supportedLngs: ['en', 'fi', 'zh', 'sv', 'es', 'fr', 'de'],
      defaultNS: 'translation',
      debug: import.meta.env.DEV,
      lng: 'en', // Force English for server
      interpolation: { escapeValue: false },
      resources: {
        en: { translation: enTranslations },
      },
    })
  } else {
    // Client-side: use HTTP backend
    const { default: HttpBackend } = await import('i18next-http-backend')

    await i18n
      .use(HttpBackend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: 'en',
        supportedLngs: ['en', 'fi', 'zh', 'sv', 'es', 'fr', 'de'],
        defaultNS: 'translation',
        debug: import.meta.env.DEV,
        interpolation: { escapeValue: false },
        detection: {
          order: ['localStorage', 'navigator'],
          lookupLocalStorage: 'jobaio-preferences-lang',
          caches: ['localStorage'],
        },
        backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
      })
  }
}

await initializeI18n()

export default i18n
