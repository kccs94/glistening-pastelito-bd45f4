import React from 'react'
import { C } from './shared'

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({
  label,
  color,
  bg,
}: {
  label: string
  color: string
  bg: string
}) {
  return (
    <span
      style={{
        color,
        background: bg,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  )
}

// ─── Btn ──────────────────────────────────────────────────────────────────────

export function Btn({
  children,
  onClick,
  variant = 'primary',
  small,
  full,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'outline'
  small?: boolean
  full?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.amber, color: '#000' },
    ghost: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: C.red, color: '#fff' },
    success: { background: C.green, color: '#000' },
    outline: { background: 'transparent', color: C.amber, border: `1px solid ${C.amber}` },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        padding: small ? '5px 10px' : '10px 16px',
        borderRadius: 8,
        fontFamily: 'inherit',
        fontWeight: 700,
        fontSize: small ? 12 : 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: full ? '100%' : undefined,
        transition: 'opacity 0.15s',
        border: styles[variant].border ?? 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  step,
}: {
  label?: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  min?: number
  step?: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.06em' }}>
          {label.toUpperCase()}
        </label>
      )}
      <input
        type={type}
        value={value}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          color: C.text,
          fontFamily: 'inherit',
          fontSize: 14,
          padding: '10px 12px',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[] | string[]
}) {
  const opts =
    typeof options[0] === 'string'
      ? (options as string[]).map((o) => ({ value: o, label: o }))
      : (options as { value: string; label: string }[])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.06em' }}>
          {label.toUpperCase()}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          color: C.text,
          fontFamily: 'inherit',
          fontSize: 14,
          padding: '10px 12px',
          outline: 'none',
          width: '100%',
          appearance: 'none',
          cursor: 'pointer',
        }}
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value} style={{ background: C.surface }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
  icon?: string
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: '0.08em' }}>
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent ?? C.text, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export function Toast({
  message,
  type = 'success',
  onDismiss,
}: {
  message: string
  type?: 'success' | 'error' | 'info'
  onDismiss: () => void
}) {
  const bg = type === 'success' ? C.green : type === 'error' ? C.red : C.blue
  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: bg,
        color: type === 'success' ? '#000' : '#fff',
        padding: '10px 18px',
        borderRadius: 10,
        fontWeight: 700,
        fontSize: 13,
        zIndex: 9999,
        maxWidth: 380,
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      {message}
    </div>
  )
}

// ─── Sheet (bottom sheet modal) ───────────────────────────────────────────────

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          background: C.surface,
          borderRadius: '16px 16px 0 0',
          zIndex: 101,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 20px 12px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: C.muted,
              fontSize: 20,
              cursor: 'pointer',
              padding: '0 4px',
              fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: 20, flex: 1 }}>{children}</div>
      </div>
    </>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <span style={{ fontWeight: 800, fontSize: 13, color: C.muted, letterSpacing: '0.08em' }}>
        {title.toUpperCase()}
      </span>
      {action}
    </div>
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max,
  color,
}: {
  value: number
  max: number
  color: string
}) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100)
  return (
    <div
      style={{
        height: 4,
        background: C.border,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.3s',
        }}
      />
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
}
