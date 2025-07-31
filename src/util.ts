import crypto from 'node:crypto'

export function uuid(len = 16): string {
  return crypto.randomBytes(len / 2).toString('hex')
}

export function minutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
