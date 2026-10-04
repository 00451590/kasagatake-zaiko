import type { AppSettings, FirebaseWebConfig } from '../types'

const SETTINGS_KEY = 'kasagatake-app-settings'
const AUTH_KEY = 'kasagatake-authed'
export const DEFAULT_PIN = '1234'

function envFirebase(): FirebaseWebConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined
  const messagingSenderId = import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined

  if (!apiKey || !projectId || !appId) return null

  return {
    apiKey,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: storageBucket || `${projectId}.appspot.com`,
    messagingSenderId: messagingSenderId || '',
    appId,
  }
}

export function loadSettings(): AppSettings {
  const envPin = (import.meta.env.VITE_APP_PIN as string | undefined)?.trim()
  let stored: Partial<AppSettings> = {}
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) stored = JSON.parse(raw) as Partial<AppSettings>
  } catch {
    stored = {}
  }

  return {
    pin: stored.pin?.trim() || envPin || DEFAULT_PIN,
    firebase: stored.firebase ?? envFirebase(),
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function isAuthed(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === '1'
}

export function setAuthed(value: boolean) {
  if (value) sessionStorage.setItem(AUTH_KEY, '1')
  else sessionStorage.removeItem(AUTH_KEY)
}

export function isFirebaseConfigured(config: FirebaseWebConfig | null): boolean {
  return Boolean(config?.apiKey && config?.projectId && config?.appId)
}
