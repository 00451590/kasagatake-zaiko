import { connect } from 'itty-sockets'
import type { InventoryItem } from '../types'

export type CloudState = {
  items: InventoryItem[]
  categoryMemory: Record<string, string>
  updatedAt: number
}

const DEFAULT_NS = 'kasagatake-zaiko-v1'
const DEFAULT_CHANNEL = 'kasagatake-zaiko-v1'

function namespace() {
  return (import.meta.env.VITE_MANTLE_NAMESPACE as string | undefined)?.trim() || DEFAULT_NS
}

function mantleKey() {
  return (import.meta.env.VITE_MANTLE_KEY as string | undefined)?.trim() || ''
}

function channelName() {
  return (import.meta.env.VITE_SYNC_CHANNEL as string | undefined)?.trim() || DEFAULT_CHANNEL
}

function headers(withJson = false): HeadersInit {
  const h: Record<string, string> = {}
  if (withJson) h['Content-Type'] = 'application/json'
  const key = mantleKey()
  if (key) h['X-Mantle-Key'] = key
  return h
}

export function isCloudSyncConfigured(): boolean {
  return Boolean(mantleKey())
}

export async function fetchCloudState(): Promise<CloudState> {
  const res = await fetch(`https://mantledb.sh/v2/${namespace()}/state`, {
    headers: headers(),
  })
  if (res.status === 404) {
    return { items: [], categoryMemory: {}, updatedAt: 0 }
  }
  if (!res.ok) {
    throw new Error(`共有データの読み込みに失敗しました (${res.status})`)
  }
  const data = (await res.json()) as Partial<CloudState>
  return {
    items: Array.isArray(data.items) ? data.items : [],
    categoryMemory:
      data.categoryMemory && typeof data.categoryMemory === 'object'
        ? data.categoryMemory
        : {},
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
  }
}

export async function saveCloudState(state: CloudState): Promise<void> {
  const res = await fetch(`https://mantledb.sh/v2/${namespace()}/state`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify(state),
  })
  if (!res.ok) {
    throw new Error(`共有データの保存に失敗しました (${res.status})`)
  }
}

export function connectSyncChannel(handlers: {
  onRemoteUpdate: () => void
  onStatus?: (label: string) => void
}): { notify: (updatedAt: number) => void; close: () => void } {
  const socket = connect(channelName())
  socket.on('open', () => handlers.onStatus?.('リアルタイム同期中'))
  socket.on('close', () => handlers.onStatus?.('再接続中…'))
  socket.on('message', (payload) => {
    const message = payload.message as { type?: string } | undefined
    if (message && typeof message === 'object' && message.type === 'inventory-updated') {
      handlers.onRemoteUpdate()
    }
  })

  return {
    notify: (updatedAt: number) => {
      socket.send({ type: 'inventory-updated', updatedAt })
    },
    close: () => {
      socket.close()
    },
  }
}
