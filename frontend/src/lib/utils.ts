import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number | null): string {
  if (!seconds) return '--'
  const minutes = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${minutes}:${secs.padStart(6, '0')}`
}

export function formatLapTime(seconds: number | null): string {
  if (!seconds) return '--'
  if (seconds < 60) {
    return `${seconds.toFixed(3)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = (seconds % 60).toFixed(3)
  return `${minutes}:${remainingSeconds.padStart(6, '0')}`
}

export function getCompoundColor(compound: string): string {
  const colors = {
    'SOFT': 'bg-red-500 text-white',
    'MEDIUM': 'bg-yellow-500 text-black',
    'HARD': 'bg-white text-black border',
    'INTERMEDIATE': 'bg-green-500 text-white',
    'WET': 'bg-blue-500 text-white'
  }
  return colors[compound as keyof typeof colors] || 'bg-gray-500 text-white'
}