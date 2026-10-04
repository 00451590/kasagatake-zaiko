export type InventoryItem = {
  id: string
  name: string
  category: string
  packSize: string
  stock: string
  orderQty: string
  note: string
  createdAt: number
  updatedAt: number
}

export type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export type AppSettings = {
  pin: string
  firebase: FirebaseWebConfig | null
}

export type ViewMode = 'list' | 'order' | 'settings'

export type ItemDraft = {
  name: string
  category: string
  packSize: string
  stock: string
  orderQty: string
  note: string
}

export const EMPTY_DRAFT: ItemDraft = {
  name: '',
  category: '',
  packSize: '',
  stock: '',
  orderQty: '',
  note: '',
}
