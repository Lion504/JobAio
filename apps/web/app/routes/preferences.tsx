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
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { MultiSelect } from '@/components/ui/multi-select'

export default function Preferences() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

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
                  placeholder="e.g. JavaScript, Python, Project Management"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="job-language">Job Language</Label>
                  <MultiSelect
                    options={languageOptions}
                    selected={selectedLanguages}
                    onChange={setSelectedLanguages}
                    placeholder="Select languages"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Preferred Location</Label>
                  <Input id="location" placeholder="e.g. Remote, New York" />
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
                <Select defaultValue="en">
                  <SelectTrigger id="interface-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fi">Finnish</SelectItem>
                    <SelectItem value="sv">Swedish</SelectItem>
                  </SelectContent>
                </Select>
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
