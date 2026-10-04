import type { InventoryItem } from '../types'

type Props = {
  items: InventoryItem[]
  query: string
  onQueryChange: (value: string) => void
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  onAdjustStock: (id: string, delta: number) => void
  onUpdateStock: (id: string, stock: string) => void
  onUpdateField: (
    id: string,
    patch: Partial<Pick<InventoryItem, 'name' | 'category' | 'packSize' | 'note'>>,
  ) => void
}

export function ItemList({
  items,
  query,
  onQueryChange,
  onEdit,
  onDelete,
  onAdjustStock,
  onUpdateStock,
  onUpdateField,
}: Props) {
  const filtered = items.filter((item) => {
    const q = query.trim()
    if (!q) return true
    return [item.name, item.category, item.packSize, item.note, item.stock]
      .join(' ')
      .includes(q)
  })

  const groups = new Map<string, InventoryItem[]>()
  for (const item of filtered) {
    const key = item.category.trim() || 'その他'
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }

  return (
    <div className="list-panel">
      <div className="search-bar">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="商品名・カテゴリで探す"
          aria-label="検索"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>まだ商品がありません</p>
          <p className="muted">上の「すぐ入力」から打ち込めます</p>
        </div>
      ) : (
        [...groups.entries()].map(([category, groupItems]) => (
          <section key={category} className="category-group">
            <h2 className="category-title">{category}</h2>
            <ul className="item-list">
              {groupItems.map((item) => (
                <li key={item.id} className="item-card">
                  <div className="item-fields">
                    <label className="field">
                      <span>商品名</span>
                      <input
                        value={item.name}
                        onChange={(e) => onUpdateField(item.id, { name: e.target.value })}
                        aria-label={`${item.name}の商品名`}
                      />
                    </label>
                    <label className="field">
                      <span>カテゴリ</span>
                      <input
                        value={item.category}
                        onChange={(e) => onUpdateField(item.id, { category: e.target.value })}
                        aria-label={`${item.name}のカテゴリ`}
                      />
                    </label>
                    <label className="field">
                      <span>1個口</span>
                      <input
                        value={item.packSize}
                        onChange={(e) => onUpdateField(item.id, { packSize: e.target.value })}
                        aria-label={`${item.name}の1個口`}
                      />
                    </label>
                    <label className="field">
                      <span>備考</span>
                      <input
                        value={item.note}
                        onChange={(e) => onUpdateField(item.id, { note: e.target.value })}
                        aria-label={`${item.name}の備考`}
                      />
                    </label>
                  </div>

                  <div className="item-controls">
                    <div className="stock-control">
                      <span className="control-label">在庫</span>
                      <div className="stepper">
                        <button
                          type="button"
                          className="step-btn"
                          aria-label="在庫を減らす"
                          onClick={() => onAdjustStock(item.id, -1)}
                        >
                          −
                        </button>
                        <input
                          className="step-input"
                          value={item.stock}
                          onChange={(e) => onUpdateStock(item.id, e.target.value)}
                          aria-label={`${item.name}の在庫数`}
                        />
                        <button
                          type="button"
                          className="step-btn"
                          aria-label="在庫を増やす"
                          onClick={() => onAdjustStock(item.id, 1)}
                        >
                          ＋
                        </button>
                      </div>
                    </div>

                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn btn-secondary item-action-btn"
                        onClick={() => onEdit(item)}
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger item-action-btn"
                        onClick={() => {
                          if (confirm(`「${item.name}」を削除しますか？`)) {
                            onDelete(item)
                          }
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
