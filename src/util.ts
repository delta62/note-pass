import crypto from 'node:crypto'

export function uuid(len = 16): string {
  return crypto.randomBytes(len / 2).toString('hex')
}

export function minutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000
}
