const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || '/api'
).replace(/\/$/, '')

const receptionistId =
  import.meta.env.VITE_RECEPTIONIST_ID?.trim() || ''

export const env = {
  apiBaseUrl,
  receptionistId,
} as const