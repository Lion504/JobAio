import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useEffect, useState } from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
import { LocationSelector } from '@/components/location-selector'

type PreferencesState = {
  jobTags: string
  skills: string
  languages: string[]
  location: string[]
  interfaceLanguage: string
  aiSearchEnabled: boolean
}

const defaultPreferences: PreferencesState = {
  jobTags: '',
  skills: '',
  languages: [],
  location: [],
  interfaceLanguage: 'en',
  aiSearchEnabled: true,
}

const STORAGE_KEY = 'jobaio-preferences'

const interfaceLanguageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Finnish', value: 'fi' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
]

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

export default function Preferences() {
  const [isLoading, setIsLoading] = useState(false)
  const [preferences, setPreferences] =
    useState<PreferencesState>(defaultPreferences)
  const [isInitialized, setIsInitialized] = useState(false)

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
        }
        const { location: storedLocation, ...rest } = parsed
        setPreferences((prev) => ({
          ...prev,
          ...rest,
          location: normalizeLocationPreference(storedLocation, prev.location),
        }))
      }
    } catch (error) {
      console.error('Failed to load preferences from localStorage', error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('preferences-updated'))
    }
  }, [preferences, isInitialized])

  const updatePreferences = (updates: Partial<PreferencesState>) => {
    setPreferences((prev) => ({ ...prev, ...updates }))
  }

  const handleSave = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert('Preferences saved!')
    }, 1000)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/50">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Preferences</h1>
            <p className="text-muted-foreground">
              Manage your job search and application settings.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
              <CardDescription>
                Customize what kind of jobs you want to see.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Job Tags</Label>
                <Input
                  id="tags"
                  value={preferences.jobTags}
                  onChange={(event) =>
                    updatePreferences({ jobTags: event.target.value })
                  }
                  placeholder="e.g. React, Startup, Fintech (comma separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Add tags to filter jobs by specific keywords.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Textarea
                  id="skills"
                  value={preferences.skills}
                  onChange={(event) =>
                    updatePreferences({ skills: event.target.value })
                  }
                  placeholder="e.g. JavaScript, Python, Project Management"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="job-language">Job Language</Label>
                  <MultiSelect
                    options={languageOptions}
                    selected={preferences.languages}
                    onChange={(languages) => updatePreferences({ languages })}
                    placeholder="Select languages"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred-location">
                    Preferred Locations
                  </Label>
                  <LocationSelector
                    multiple
                    id="preferred-location"
                    value={preferences.location}
                    onChange={(value) => updatePreferences({ location: value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose one or more cities to personalize job suggestions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Settings</CardTitle>
              <CardDescription>
                Configure your application experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interface-language">Interface Language</Label>
                <Select
                  value={preferences.interfaceLanguage}
                  onValueChange={(value) =>
                    updatePreferences({ interfaceLanguage: value })
                  }
                >
                  <SelectTrigger id="interface-language">
                    <SelectValue placeholder="Select language" />
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-search">AI-Enhanced Search</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically expand search queries with related
                    technologies and job titles for better results.
                  </p>
                </div>
                <Switch
                  id="ai-search"
                  checked={preferences.aiSearchEnabled}
                  onCheckedChange={(checked: boolean) =>
                    updatePreferences({ aiSearchEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
