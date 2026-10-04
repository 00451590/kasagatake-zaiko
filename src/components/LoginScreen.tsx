import { useState } from 'react'

type Props = {
  onLogin: (pin: string) => boolean
}

export function LoginScreen({ onLogin }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const submit = () => {
    const ok = onLogin(pin)
    if (!ok) {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="brand-kicker">Kasagatake Sanso</p>
        <h1 className="brand-title">笠ヶ岳山荘</h1>
        <p className="brand-sub">在庫管理</p>
        <p className="login-help">スタッフ用の番号を入力してください</p>
        <input
          className="pin-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          type="password"
          maxLength={12}
          placeholder="PIN"
          value={pin}
          onChange={(e) => {
            setError(false)
            setPin(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        {error ? <p className="error-text">番号が違います</p> : null}
        <button type="button" className="btn btn-primary btn-block" onClick={submit}>
          はじめる
        </button>
      </div>
    </div>
  )
}
