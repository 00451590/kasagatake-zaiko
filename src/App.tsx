import { useMemo, useState } from 'react'
import { ItemForm } from './components/ItemForm'
import { ItemList } from './components/ItemList'
import { LoginScreen } from './components/LoginScreen'
import { QuickAddBar } from './components/QuickAddBar'
import { SettingsPanel } from './components/SettingsPanel'
import { useAppSettings, useInventory } from './hooks/useInventory'
import { exportFullExcel, exportOrderExcel } from './lib/excel'
import { isAuthed, setAuthed } from './lib/settings'
import type { InventoryItem, ViewMode } from './types'

function App() {
  const { settings, setSettings } = useAppSettings()
  const [authed, setAuthedState] = useState(() => isAuthed())
  const [view, setView] = useState<ViewMode>('list')
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)

  const inventory = useInventory(settings)

  const title = useMemo(() => {
    if (view === 'order') return '発注'
    if (view === 'settings') return '設定'
    return '在庫一覧'
  }, [view])

  if (!authed) {
    return (
      <LoginScreen
        onLogin={(pin) => {
          if (pin.trim() === settings.pin) {
            setAuthed(true)
            setAuthedState(true)
            return true
          }
          return false
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="header-brand">笠ヶ岳山荘</p>
          <h1>{title}</h1>
        </div>
        <div className="header-meta">
          <span className={`sync-pill ${inventory.cloudEnabled ? 'is-live' : 'is-local'}`}>
            {inventory.syncLabel}
          </span>
          <span className="count-pill">
            {view === 'order'
              ? `発注 ${inventory.stats.orderCount}件`
              : `商品 ${inventory.stats.total}件`}
          </span>
        </div>
      </header>

      <nav className="tab-bar" aria-label="画面切替">
        <button
          type="button"
          className={view === 'list' ? 'tab is-active' : 'tab'}
          onClick={() => setView('list')}
        >
          在庫
        </button>
        <button
          type="button"
          className={view === 'order' ? 'tab is-active' : 'tab'}
          onClick={() => setView('order')}
        >
          発注
        </button>
        <button
          type="button"
          className={view === 'settings' ? 'tab is-active' : 'tab'}
          onClick={() => setView('settings')}
        >
          設定
        </button>
      </nav>

      {inventory.error ? <p className="banner-error">{inventory.error}</p> : null}
      {inventory.loading ? <p className="banner-info">読み込み中…</p> : null}

      <main className="app-main">
        {view === 'settings' ? (
          <SettingsPanel
            settings={settings}
            syncLabel={inventory.syncLabel}
            cloudEnabled={inventory.cloudEnabled}
            onSave={setSettings}
            onLogout={() => {
              setAuthed(false)
              setAuthedState(false)
            }}
          />
        ) : (
          <>
            <QuickAddBar
              items={inventory.items}
              categoryMemory={inventory.categoryMemory}
              hidden={view === 'order'}
              onAdd={async (draft) => {
                await inventory.saveItem(draft)
              }}
            />

            <div className="toolbar">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  void exportFullExcel(inventory.items)
                }}
              >
                在庫Excel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  void exportOrderExcel(inventory.items)
                }}
              >
                発注Excel
              </button>
            </div>

            <ItemList
              items={inventory.items}
              query={query}
              onQueryChange={setQuery}
              orderOnly={view === 'order'}
              onEdit={(item) => {
                setEditing(item)
                setFormOpen(true)
              }}
              onAdjustStock={(id, delta) => {
                void inventory.adjustStock(id, delta)
              }}
              onUpdateStock={(id, stock) => {
                void inventory.updateFields(id, { stock })
              }}
              onUpdateOrder={(id, orderQty) => {
                void inventory.updateFields(id, { orderQty })
              }}
              onUpdateField={(id, patch) => {
                void inventory.updateFields(id, patch)
              }}
            />
          </>
        )}
      </main>

      <ItemForm
        open={formOpen}
        editing={editing}
        items={inventory.items}
        categoryMemory={inventory.categoryMemory}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={inventory.saveItem}
        onDelete={inventory.deleteItem}
      />
    </div>
  )
}

export default App
