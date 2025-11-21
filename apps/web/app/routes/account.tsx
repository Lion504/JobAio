import { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'react-router'

export default function Account() {
  const { user, login, logout } = useAuth()
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const toggleSync = (nextEnabled: boolean) => {
    setSyncEnabled(nextEnabled)
    setLastSyncedAt(nextEnabled ? new Date() : null)
  }

  const handleMockSync = () => {
    if (!syncEnabled) return
    setLastSyncedAt(new Date())
  }

  if (user) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold">Sync across devices</p>
                  <p className="text-sm text-muted-foreground">
                    Keep preferences and saved filters aligned across every
                    device.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {syncEnabled && lastSyncedAt
                      ? `Last sync ${lastSyncedAt.toLocaleTimeString()}`
                      : 'Syncing is currently disabled for this account.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sync-settings"
                    checked={syncEnabled}
                    onCheckedChange={(checked) => toggleSync(checked === true)}
                  />
                  <Label
                    htmlFor="sync-settings"
                    className="text-sm font-medium"
                  >
                    {syncEnabled ? 'On' : 'Off'}
                  </Label>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                disabled={!syncEnabled}
                onClick={handleMockSync}
              >
                Mock sync now
              </Button>
            </div>
            <div className="flex justify-center">
              <Button variant="destructive" onClick={logout}>
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <Button className="w-full" onClick={login}>
              Login
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
