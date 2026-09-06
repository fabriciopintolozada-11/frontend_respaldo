import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ERROR_CODE_LEADING = /^\s*(?:US|HU|RN|FE)-\d+\s*:?\s*/i
const ERROR_CODE_INLINE = /\s*\(?(?:US|HU|RN|FE)-\d+\)?\s*/gi

export function cleanServerMessage(message: unknown): string {
  const text = typeof message === 'string' && message.trim() ? message.trim() : ''
  if (!text) return ''
  return text.replace(ERROR_CODE_LEADING, '').replace(ERROR_CODE_INLINE, ' ').replace(/\s{2,}/g, ' ').trim()
}
