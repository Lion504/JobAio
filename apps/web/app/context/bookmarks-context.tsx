import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import type { Job } from '@/components/job-card'

interface BookmarksContextType {
  savedJobs: Job[]
  addBookmark: (job: Job) => void
  removeBookmark: (jobId: string) => void
  isBookmarked: (jobId: string) => boolean
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(
  undefined
)

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [savedJobs, setSavedJobs] = useState<Job[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('jobaio-bookmarks')
    if (stored) {
      try {
        setSavedJobs(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse bookmarks', e)
      }
    }
  }, [])

  // Save to localStorage whenever savedJobs changes
  useEffect(() => {
    localStorage.setItem('jobaio-bookmarks', JSON.stringify(savedJobs))
  }, [savedJobs])

  const addBookmark = (job: Job) => {
    setSavedJobs((prev) => {
      if (prev.some((j) => j.id === job.id)) return prev
      return [...prev, job]
    })
  }

  const removeBookmark = (jobId: string) => {
    setSavedJobs((prev) => prev.filter((job) => job.id !== jobId))
  }

  const isBookmarked = (jobId: string) => {
    return savedJobs.some((job) => job.id === jobId)
  }

  return (
    <BookmarksContext.Provider
      value={{ savedJobs, addBookmark, removeBookmark, isBookmarked }}
    >
      {children}
    </BookmarksContext.Provider>
  )
}

export function useBookmarks() {
  const context = useContext(BookmarksContext)
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider')
  }
  return context
}
