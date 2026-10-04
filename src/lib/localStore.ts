import type { InventoryItem } from '../types'

const ITEMS_KEY = 'kasagatake-local-items'
const MEMORY_CLOUD_KEY = 'kasagatake-local-category-memory'

export function loadLocalItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InventoryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalItems(items: InventoryItem[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
}

export function loadLocalCategoryMemory(): Record<string, string> {
  try {
    const raw = localStorage.getItem(MEMORY_CLOUD_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveLocalCategoryMemory(memory: Record<string, string>) {
  localStorage.setItem(MEMORY_CLOUD_KEY, JSON.stringify(memory))
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
