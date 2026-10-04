import { useEffect, useMemo, useState } from 'react'
import { collectCategories, suggestCategory } from '../lib/categories'
import type { InventoryItem, ItemDraft } from '../types'
import { EMPTY_DRAFT } from '../types'

type Props = {
  open: boolean
  editing: InventoryItem | null
  items: InventoryItem[]
  categoryMemory: Record<string, string>
  onClose: () => void
  onSave: (draft: ItemDraft, editingId?: string | null) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function ItemForm({
  open,
  editing,
  items,
  categoryMemory,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<ItemDraft>(EMPTY_DRAFT)
  const [autoCategory, setAutoCategory] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = useMemo(() => collectCategories(items), [items])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setDraft({
        name: editing.name,
        category: editing.category,
        packSize: editing.packSize,
        stock: editing.stock,
        orderQty: editing.orderQty,
        note: editing.note,
      })
      setAutoCategory(false)
    } else {
      setDraft(EMPTY_DRAFT)
      setAutoCategory(true)
    }
    setError(null)
  }, [open, editing])

  if (!open) return null

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
    setSaving(true)
    setError(null)
    try {
      await onSave(draft, editing?.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? '商品を編集' : '商品を追加'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{editing ? '商品を編集' : '商品を追加'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <p className="modal-hint">どの欄からでも入力できます。空欄のままでも大丈夫です。</p>

        <label className="field">
          <span>商品名（必須）</span>
          <input
            value={draft.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="例: ほんだし"
          />
        </label>

        <label className="field">
          <span>カテゴリ（自動で入ります）</span>
          <div className="field-row">
            <input
              list="category-options"
              value={draft.category}
              onChange={(e) => {
                setAutoCategory(false)
                setField('category', e.target.value)
              }}
              placeholder="例: 高山米穀（食品）"
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setAutoCategory(true)
                setField('category', suggestCategory(draft.name, categoryMemory))
              }}
            >
              自動
            </button>
          </div>
          <datalist id="category-options">
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
            placeholder="例: 1kg / 24本 / 500g"
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span>在庫数</span>
            <input
              value={draft.stock}
              onChange={(e) => setField('stock', e.target.value)}
              placeholder="例: 3"
            />
          </label>
          <label className="field">
            <span>発注数</span>
            <input
              value={draft.orderQty}
              onChange={(e) => setField('orderQty', e.target.value)}
              placeholder="後からでもOK"
            />
          </label>
        </div>

        <label className="field">
          <span>備考</span>
          <textarea
            value={draft.note}
            onChange={(e) => setField('note', e.target.value)}
            placeholder="自由にメモ"
            rows={3}
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={saving}
            onClick={() => void submit()}
          >
            {saving ? '保存中…' : '保存する'}
          </button>
          {editing && onDelete ? (
            <button
              type="button"
              className="btn btn-danger btn-block"
              disabled={saving}
              onClick={() => {
                if (confirm(`「${editing.name}」を削除しますか？`)) {
                  void onDelete(editing.id).then(onClose)
                }
              }}
            >
              削除する
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
