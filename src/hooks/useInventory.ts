import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeName, rememberCategory } from '../lib/categories'
import {
  connectSyncChannel,
  fetchCloudState,
  isCloudSyncConfigured,
  saveCloudState,
} from '../lib/cloudSync'
import {
  createId,
  loadLocalCategoryMemory,
  loadLocalItems,
  saveLocalCategoryMemory,
  saveLocalItems,
} from '../lib/localStore'
import { loadSettings, saveSettings } from '../lib/settings'
import type { AppSettings, InventoryItem, ItemDraft } from '../types'

function sortItems(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => {
    const cat = a.category.localeCompare(b.category, 'ja')
    if (cat !== 0) return cat
    return a.name.localeCompare(b.name, 'ja')
  })
}

export function useInventory(_settings: AppSettings) {
  const cloudEnabled = isCloudSyncConfigured()
  const [items, setItems] = useState<InventoryItem[]>(() =>
    cloudEnabled ? [] : loadLocalItems(),
  )
  const [categoryMemory, setCategoryMemory] = useState<Record<string, string>>(
    () => loadLocalCategoryMemory(),
  )
  const [loading, setLoading] = useState(cloudEnabled)
  const [error, setError] = useState<string | null>(null)
  const [syncLabel, setSyncLabel] = useState(
    cloudEnabled ? '共有データ接続中…' : 'この端末のみ',
  )
  const updatedAtRef = useRef(0)
  const notifyRef = useRef<(updatedAt: number) => void>(() => {})
  const writingRef = useRef(false)
  const debounceRef = useRef<number | null>(null)
  const pendingRef = useRef<{
    items: InventoryItem[]
    memory: Record<string, string>
  } | null>(null)

  const refreshFromCloud = useCallback(async () => {
    if (!cloudEnabled || writingRef.current) return
    try {
      const state = await fetchCloudState()
      if (state.updatedAt < updatedAtRef.current) return
      updatedAtRef.current = state.updatedAt
      setItems(sortItems(state.items))
      setCategoryMemory(state.categoryMemory)
      saveLocalItems(state.items)
      saveLocalCategoryMemory(state.categoryMemory)
      setError(null)
      setSyncLabel('リアルタイム同期中')
    } catch (err) {
      setError(err instanceof Error ? err.message : '同期に失敗しました')
      setSyncLabel('同期エラー')
    }
  }, [cloudEnabled])

  useEffect(() => {
    if (!cloudEnabled) {
      setItems(loadLocalItems())
      setCategoryMemory(loadLocalCategoryMemory())
      setLoading(false)
      setSyncLabel('この端末のみ')
      return
    }

    let closed = false
    setLoading(true)
    void (async () => {
      try {
        const state = await fetchCloudState()
        if (closed) return
        updatedAtRef.current = state.updatedAt
        setItems(sortItems(state.items))
        setCategoryMemory(state.categoryMemory)
        saveLocalItems(state.items)
        saveLocalCategoryMemory(state.categoryMemory)
        setSyncLabel('リアルタイム同期中')
        setError(null)
      } catch (err) {
        if (closed) return
        setItems(loadLocalItems())
        setCategoryMemory(loadLocalCategoryMemory())
        setError(err instanceof Error ? err.message : '同期に失敗しました')
        setSyncLabel('同期エラー（端末データを表示）')
      } finally {
        if (!closed) setLoading(false)
      }
    })()

    const channel = connectSyncChannel({
      onRemoteUpdate: () => {
        void refreshFromCloud()
      },
      onStatus: (label) => {
        if (!closed) setSyncLabel(label)
      },
    })
    notifyRef.current = channel.notify

    const poll = window.setInterval(() => {
      void refreshFromCloud()
    }, 8000)

    return () => {
      closed = true
      channel.close()
      window.clearInterval(poll)
    }
  }, [cloudEnabled, refreshFromCloud])

  const flushPersist = useCallback(async () => {
    const pending = pendingRef.current
    if (!pending || !cloudEnabled) return
    pendingRef.current = null
    const sorted = sortItems(pending.items)
    const updatedAt = Date.now()
    updatedAtRef.current = updatedAt
    writingRef.current = true
    try {
      await saveCloudState({
        items: sorted,
        categoryMemory: pending.memory,
        updatedAt,
      })
      notifyRef.current(updatedAt)
      setSyncLabel('リアルタイム同期中')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
      setSyncLabel('保存エラー')
    } finally {
      writingRef.current = false
    }
  }, [cloudEnabled])

  const persistAll = useCallback(
    async (
      nextItems: InventoryItem[],
      nextMemory: Record<string, string>,
      options?: { immediate?: boolean },
    ) => {
      const sorted = sortItems(nextItems)
      setItems(sorted)
      setCategoryMemory(nextMemory)
      saveLocalItems(sorted)
      saveLocalCategoryMemory(nextMemory)

      if (!cloudEnabled) return

      pendingRef.current = { items: sorted, memory: nextMemory }
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current)

      if (options?.immediate) {
        await flushPersist()
        return
      }

      debounceRef.current = window.setTimeout(() => {
        void flushPersist()
      }, 400)
    },
    [cloudEnabled, flushPersist],
  )

  const saveItem = useCallback(
    async (draft: ItemDraft, editingId?: string | null) => {
      const name = draft.name.trim()
      if (!name) throw new Error('商品名を入力してください')

      const now = Date.now()
      const existing = editingId ? items.find((i) => i.id === editingId) : undefined
      const item: InventoryItem = {
        id: existing?.id ?? createId(),
        name,
        category: draft.category.trim() || 'その他',
        packSize: draft.packSize.trim(),
        stock: draft.stock.trim(),
        orderQty: draft.orderQty.trim(),
        note: draft.note.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }

      rememberCategory(item.name, item.category)
      const nextMemory = {
        ...categoryMemory,
        [normalizeName(item.name)]: item.category,
      }
      const nextItems = [...items.filter((i) => i.id !== item.id), item]
      await persistAll(nextItems, nextMemory, { immediate: true })
    },
    [categoryMemory, items, persistAll],
  )

  const updateFields = useCallback(
    async (id: string, patch: Partial<ItemDraft>) => {
      const current = items.find((i) => i.id === id)
      if (!current) return

      const nextItem: InventoryItem = {
        ...current,
        ...patch,
        updatedAt: Date.now(),
      }

      let nextMemory = categoryMemory
      if (patch.category && patch.category !== current.category) {
        rememberCategory(nextItem.name, nextItem.category)
        nextMemory = {
          ...categoryMemory,
          [normalizeName(nextItem.name)]: nextItem.category,
        }
      }

      const nextItems = items.map((i) => (i.id === id ? nextItem : i))
      await persistAll(nextItems, nextMemory)
    },
    [categoryMemory, items, persistAll],
  )

  const deleteItem = useCallback(
    async (id: string) => {
      await persistAll(
        items.filter((i) => i.id !== id),
        categoryMemory,
        { immediate: true },
      )
    },
    [categoryMemory, items, persistAll],
  )

  const adjustStock = useCallback(
    async (id: string, delta: number) => {
      const current = items.find((i) => i.id === id)
      if (!current) return
      const n = Number(current.stock)
      if (!Number.isFinite(n)) {
        await updateFields(id, { stock: String(Math.max(0, delta)) })
        return
      }
      await updateFields(id, { stock: String(Math.max(0, n + delta)) })
    },
    [items, updateFields],
  )

  const stats = useMemo(
    () => ({
      total: items.length,
      orderCount: items.filter((i) => i.orderQty.trim() !== '').length,
    }),
    [items],
  )

  return {
    items,
    categoryMemory,
    loading,
    error,
    syncLabel,
    cloudEnabled,
    stats,
    saveItem,
    updateFields,
    deleteItem,
    adjustStock,
  }
}

export function useAppSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => loadSettings())

  const setSettings = useCallback((next: AppSettings) => {
    saveSettings(next)
    setSettingsState(next)
  }, [])

  return { settings, setSettings }
}
