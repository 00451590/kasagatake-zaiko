import type { InventoryItem } from '../types'

type Props = {
  items: InventoryItem[]
  query: string
  onQueryChange: (value: string) => void
  onEdit: (item: InventoryItem) => void
  onAdjustStock: (id: string, delta: number) => void
  onUpdateStock: (id: string, stock: string) => void
  onUpdateOrder: (id: string, orderQty: string) => void
  onUpdateField: (
    id: string,
    patch: Partial<Pick<InventoryItem, 'name' | 'category' | 'packSize' | 'note'>>,
  ) => void
  orderOnly?: boolean
}

export function ItemList({
  items,
  query,
  onQueryChange,
  onEdit,
  onAdjustStock,
  onUpdateStock,
  onUpdateOrder,
  onUpdateField,
  orderOnly = false,
}: Props) {
  const filtered = items.filter((item) => {
    if (orderOnly && item.orderQty.trim() === '') return false
    const q = query.trim()
    if (!q) return true
    return [item.name, item.category, item.packSize, item.note, item.stock, item.orderQty]
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
          <p>{orderOnly ? '発注数が入っている商品はまだありません' : 'まだ商品がありません'}</p>
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

                    <label className="order-control">
                      <span className="control-label">発注</span>
                      <input
                        value={item.orderQty}
                        onChange={(e) => onUpdateOrder(item.id, e.target.value)}
                        placeholder="0"
                        aria-label={`${item.name}の発注数`}
                      />
                    </label>

                    <button
                      type="button"
                      className="btn btn-ghost item-more"
                      onClick={() => onEdit(item)}
                    >
                      削除など
                    </button>
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
