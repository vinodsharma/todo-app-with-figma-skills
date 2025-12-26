'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

type ThemeValue = (typeof themes)[number]['value']

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sync theme from database when user logs in
  React.useEffect(() => {
    if (session?.user && mounted) {
      fetch('/api/user/theme')
        .then((res) => res.json())
        .then((data) => {
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme)
          }
        })
        .catch((error) => {
          console.error('Failed to fetch theme preference:', error)
        })
    }
  }, [session?.user, mounted]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleThemeChange = async (newTheme: ThemeValue) => {
    // Apply immediately via next-themes
    setTheme(newTheme)

    // Persist to database if logged in
    if (session?.user) {
      try {
        await fetch('/api/user/theme', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme }),
        })
      } catch (error) {
        // Theme still works locally even if API fails
        console.error('Failed to save theme preference:', error)
      }
    }
  }

  // Show placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const currentTheme = themes.find((t) => t.value === theme) ?? themes[2]
  const CurrentIcon = currentTheme.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <CurrentIcon className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleThemeChange(value)}
            className={theme === value ? 'bg-accent' : ''}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
