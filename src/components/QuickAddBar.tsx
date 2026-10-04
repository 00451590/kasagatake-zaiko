import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { collectCategories, suggestCategory } from '../lib/categories'
import type { InventoryItem, ItemDraft } from '../types'
import { EMPTY_DRAFT } from '../types'

type Props = {
  items: InventoryItem[]
  categoryMemory: Record<string, string>
  onAdd: (draft: ItemDraft) => Promise<void>
  hidden?: boolean
}

export function QuickAddBar({ items, categoryMemory, onAdd, hidden }: Props) {
  const [draft, setDraft] = useState<ItemDraft>(EMPTY_DRAFT)
  const [autoCategory, setAutoCategory] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const categories = useMemo(() => collectCategories(items), [items])

  useEffect(() => {
    if (!hidden) nameRef.current?.focus()
  }, [hidden])

  if (hidden) return null

  const setField = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && autoCategory) {
        next.category = suggestCategory(String(value), categoryMemory)
      }
      return next
    })
  }

  const submit = async () => {
    if (!draft.name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onAdd(draft)
      setDraft(EMPTY_DRAFT)
      setAutoCategory(true)
      requestAnimationFrame(() => nameRef.current?.focus())
    } catch (err) {
      setError(err instanceof Error ? err.message : '追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <section className="quick-add" aria-label="新しい商品を入力">
      <div className="quick-add-head">
        <h2>すぐ入力</h2>
        <p>どの欄からでもOK。Enter で次の商品へ</p>
      </div>

      <div className="quick-add-grid">
        <label className="field">
          <span>商品名</span>
          <input
            ref={nameRef}
            value={draft.name}
            onChange={(e) => setField('name', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="例: ほんだし"
          />
        </label>

        <label className="field">
          <span>カテゴリ</span>
          <input
            list="quick-category-options"
            value={draft.category}
            onChange={(e) => {
              setAutoCategory(false)
              setField('category', e.target.value)
            }}
            onKeyDown={onKeyDown}
            placeholder="自動で入ります"
          />
          <datalist id="quick-category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span>1個口</span>
          <input
            value={draft.packSize}
            onChange={(e) => setField('packSize', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="1kg / 24本"
          />
        </label>

        <label className="field">
          <span>在庫数</span>
          <input
            value={draft.stock}
            onChange={(e) => setField('stock', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="3"
          />
        </label>

        <label className="field">
          <span>発注数</span>
          <input
            value={draft.orderQty}
            onChange={(e) => setField('orderQty', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="後からでもOK"
          />
        </label>

        <label className="field quick-add-note">
          <span>備考</span>
          <input
            value={draft.note}
            onChange={(e) => setField('note', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="メモ"
          />
        </label>

        <button
          type="button"
          className="btn btn-primary quick-add-submit"
          disabled={saving || !draft.name.trim()}
          onClick={() => void submit()}
        >
          {saving ? '追加中…' : '入れる'}
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}
