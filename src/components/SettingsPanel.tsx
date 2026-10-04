import { useState } from 'react'
import { DEFAULT_PIN } from '../lib/settings'
import type { AppSettings } from '../types'

type Props = {
  settings: AppSettings
  syncLabel: string
  cloudEnabled: boolean
  onSave: (settings: AppSettings) => void
  onLogout: () => void
}

export function SettingsPanel({
  settings,
  syncLabel,
  cloudEnabled,
  onSave,
  onLogout,
}: Props) {
  const [pin, setPin] = useState(settings.pin || DEFAULT_PIN)
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="settings-panel">
      <section className="settings-block">
        <h2>同期状態</h2>
        <p className={cloudEnabled ? 'ok-text' : 'warn-text'}>{syncLabel}</p>
        <p className="muted">
          {cloudEnabled
            ? '同じURLを開けば、PC・スマホで在庫が共有されます。'
            : '共有設定がありません。この端末だけの保存です。'}
        </p>
      </section>

      <section className="settings-block">
        <h2>PIN（入室番号）</h2>
        <input
          className="settings-input"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          inputMode="numeric"
        />
        <p className="muted">最初の番号は {DEFAULT_PIN} です。変えたら忘れないようにしてください。</p>
      </section>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => {
          onSave({ ...settings, pin: pin.trim() || DEFAULT_PIN })
          setMessage('設定を保存しました')
        }}
      >
        設定を保存
      </button>
      {message ? <p className="ok-text">{message}</p> : null}

      <button type="button" className="btn btn-ghost btn-block" onClick={onLogout}>
        ログアウト
      </button>
    </div>
  )
}
