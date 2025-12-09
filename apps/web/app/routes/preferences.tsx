import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useEffect, useState, useRef } from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
import { LocationSelector } from '@/components/location-selector'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LANGUAGE_COOKIE } from '@/i18n'
import { type HeadersFunction, type MetaFunction } from 'react-router'

export const meta: MetaFunction = () => [
  { title: 'JobAio | Preferences' },
  {
    name: 'description',
    content: 'Set your job preferences, languages, and locations.',
  },
]

export const headers: HeadersFunction = () => ({
  'Cache-Control': 'private, max-age=0, must-revalidate',
})

export function loader() {
  return { ok: true }
}

type PreferencesState = {
  jobTags: string
  skills: string
  languages: string[]
  location: string[]
  interfaceLanguage: string
}

const defaultPreferences: PreferencesState = {
  jobTags: '',
  skills: '',
  languages: [],
  location: [],
  interfaceLanguage: 'en',
}

const STORAGE_KEY = 'jobaio-preferences'
const PREFERENCES_COOKIE = 'jobaio-preferences'

function normalizeLocationPreference(
  value: string[] | string | undefined,
  fallback: string[] = []
) {
  if (Array.isArray(value)) {
    const sanitized = value.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0
    )
    return sanitized.length > 0 ? sanitized : fallback
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? [trimmed] : fallback
  }

  return fallback
}

function writePreferencesCookie(preferences: PreferencesState) {
  const { jobTags, skills, languages, location, interfaceLanguage } =
    preferences
  const payload: PreferencesState = {
    jobTags,
    skills,
    languages,
    location,
    interfaceLanguage,
  }
  const maxAge = 60 * 60 * 24 * 30 // 30 days
  document.cookie = `${PREFERENCES_COOKIE}=${encodeURIComponent(JSON.stringify(payload))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  document.cookie = `${LANGUAGE_COOKIE}=${interfaceLanguage}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

export default function Preferences() {
  const { t, i18n } = useTranslation()
  const [showSuccess, setShowSuccess] = useState(false)
  const [preferences, setPreferences] =
    useState<PreferencesState>(defaultPreferences)
  const [isInitialized, setIsInitialized] = useState(false)
  const isFirstSave = useRef(true)

  const interfaceLanguageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Chinese', value: 'zh' },
    { label: 'Finnish', value: 'fi' },
    { label: 'Swedish', value: 'sv' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
  ]

  const languageOptions = [
    {
      label: 'English',
      value: 'en',
      icon: <span className="text-lg">🇺🇸</span>,
    },
    {
      label: 'Spanish',
      value: 'es',
      icon: <span className="text-lg">🇪🇸</span>,
    },
    { label: 'French', value: 'fr', icon: <span className="text-lg">🇫🇷</span> },
    { label: 'German', value: 'de', icon: <span className="text-lg">🇩🇪</span> },
    {
      label: 'Chinese',
      value: 'zh',
      icon: <span className="text-lg">🇨🇳</span>,
    },
    {
      label: 'Japanese',
      value: 'ja',
      icon: <span className="text-lg">🇯🇵</span>,
    },
    { label: 'Korean', value: 'ko', icon: <span className="text-lg">🇰🇷</span> },
    {
      label: 'Portuguese',
      value: 'pt',
      icon: <span className="text-lg">🇵🇹</span>,
    },
    {
      label: 'Russian',
      value: 'ru',
      icon: <span className="text-lg">🇷🇺</span>,
    },
    {
      label: 'Italian',
      value: 'it',
      icon: <span className="text-lg">🇮🇹</span>,
    },
    { label: 'Dutch', value: 'nl', icon: <span className="text-lg">🇳🇱</span> },
    {
      label: 'Finnish',
      value: 'fi',
      icon: <span className="text-lg">🇫🇮</span>,
    },
    {
      label: 'Swedish',
      value: 'sv',
      icon: <span className="text-lg">🇸🇪</span>,
    },
  ]

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PreferencesState> & {
          location?: string | string[]
          aiSearchEnabled?: boolean
        }
        const {
          location: storedLocation,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          aiSearchEnabled: _legacyAi,
          ...rest
        } = parsed
        if (
          rest.interfaceLanguage &&
          rest.interfaceLanguage !== i18n.language
        ) {
          i18n.changeLanguage(rest.interfaceLanguage)
          localStorage.setItem(
            'jobaio-preferences-lang',
            rest.interfaceLanguage
          )
        }

        setPreferences((prev) => ({
          ...prev,
          ...rest,
          location: normalizeLocationPreference(storedLocation, prev.location),
        }))
      } else {
        setPreferences((prev) => ({
          ...prev,
          interfaceLanguage: i18n.language,
        }))
      }
    } catch (error) {
      console.error('Failed to load preferences from localStorage', error)
    } finally {
      setIsInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    if (preferences.interfaceLanguage) {
      localStorage.setItem(
        'jobaio-preferences-lang',
        preferences.interfaceLanguage
      )
    }
    writePreferencesCookie(preferences)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('preferences-updated'))
    }

    if (isFirstSave.current) {
      isFirstSave.current = false
      return
    }

    setShowSuccess(true)
    const timeout = setTimeout(() => setShowSuccess(false), 1800)
    return () => clearTimeout(timeout)
  }, [preferences, isInitialized])

  const updatePreferences = (updates: Partial<PreferencesState>) => {
    setPreferences((prev) => ({ ...prev, ...updates }))

    if (
      updates.interfaceLanguage &&
      updates.interfaceLanguage !== i18n.language
    ) {
      i18n.changeLanguage(updates.interfaceLanguage)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden bg-muted/50 relative">
        <ScrollArea className="h-full w-full">
          <div className="mx-auto max-w-3xl space-y-6 p-6 pt-12">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">
                {t('preferences.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('preferences.description')}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('preferences.jobPreferences')}</CardTitle>
                <CardDescription>
                  {t('preferences.jobPreferencesDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tags">{t('preferences.jobTags')}</Label>
                  <Input
                    id="tags"
                    value={preferences.jobTags}
                    onChange={(event) =>
                      updatePreferences({ jobTags: event.target.value })
                    }
                    placeholder={t('preferences.jobTagsPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('preferences.jobTagsDesc')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">{t('preferences.skills')}</Label>
                  <Textarea
                    id="skills"
                    value={preferences.skills}
                    onChange={(event) =>
                      updatePreferences({ skills: event.target.value })
                    }
                    placeholder={t('preferences.skillsPlaceholder')}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="job-language">
                      {t('preferences.jobLanguage')}
                    </Label>
                    <MultiSelect
                      options={languageOptions}
                      selected={preferences.languages}
                      onChange={(languages) => updatePreferences({ languages })}
                      placeholder={t('preferences.selectLanguages')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferred-location">
                      {t('preferences.preferredLocations')}
                    </Label>
                    <LocationSelector
                      multiple
                      id="preferred-location"
                      value={preferences.location}
                      onChange={(value) =>
                        updatePreferences({ location: value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('preferences.preferredLocationsDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('preferences.appSettings')}</CardTitle>
                <CardDescription>
                  {t('preferences.appSettingsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="interface-language">
                    {t('preferences.interfaceLanguage')}
                  </Label>
                  <Select
                    value={preferences.interfaceLanguage}
                    onValueChange={(value) =>
                      updatePreferences({ interfaceLanguage: value })
                    }
                  >
                    <SelectTrigger id="interface-language">
                      <SelectValue
                        placeholder={t('preferences.selectLanguage')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {interfaceLanguageOptions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {showSuccess && (
              <div className="flex items-center justify-end gap-2 text-sm font-medium text-green-600 dark:text-green-500 animate-in fade-in slide-in-from-right-2">
                <Check className="h-4 w-4" />
                {t('common.saved', 'Saved')}
              </div>
            )}
            {!showSuccess && (
              <div className="flex justify-end text-xs text-muted-foreground">
                {t('preferences.autoSave', 'Changes are saved automatically')}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
