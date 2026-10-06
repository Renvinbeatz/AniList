import 'server-only'
import crypto from 'crypto'

export function generateGhostEmail(): string {
  // Generates a technical email that cannot clash with real emails
  // and is completely unguessable.
  return `${crypto.randomUUID()}@ghost.tracker.local`
}
