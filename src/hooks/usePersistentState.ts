import { useState, useEffect, Dispatch, SetStateAction } from 'react'

export const usePersistentState = <T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key)

        return item ? JSON.parse(item) : initialValue
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error)
        return initialValue
      }
    }
    return initialValue
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    }
  }, [key, value])

  return [value, setValue]
}
