import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import type { User, Outlet, Tab, AppSettings } from '../components/bretzel/shared'
import {
  C,
  OUTLETS,
  STAFF,
  MANAGER_PASSWORD,
  store,
  STORAGE_KEYS,
  outletForStaff,
  ALL_STAFF,
  DEFAULT_SETTINGS,
} from '../components/bretzel/shared'
import { DashboardTab } from '../components/bretzel/Dashboard'
import { StockTab } from '../components/bretzel/Stock'
import { SalesTab } from '../components/bretzel/Sales'
import { ScheduleTab } from '../components/bretzel/Schedule'
import { PerformanceTab } from '../components/bretzel/Performance'
import { SettingsTab } from '../components/bretzel/Settings'
import { SettingsSheet } from '../components/bretzel/SettingsSheet'

export const Route = createFileRoute('/')({
  component: BretzelApp,
})

// ─── Icons (SVG inline) ───────────────────────────────────────────────────────

function IconDashboard({ active }: { active: boolean }) {
  const c = active ? C.amber : C.muted
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function IconPackage({ active }: { active: boolean }) {
  const c = active ? C.amber : C.muted
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  )
}

function IconReceipt({ active }: { active: boolean }) {
  const c = active ? C.amber : C.muted
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" />
    </svg>
  )
}

function IconCalendar({ active }: { active: boolean }) {
  const c = active ? C.amber : C.muted
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconChart({ active }: { active: boolean }) {
  const c = active ? C.amber : C.muted
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function IconSettings({ active }: { active: boolean }) {
  const c = active ? C.amber : C.muted
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [role, setRole] = useState<'manager' | 'staff'>('staff')
  const [password, setPassword] = useState('')
  const [staffName, setStaffName] = useState(ALL_STAFF[0])
  const [error, setError] = useState('')

  const handleLogin = () => {
    setError('')
    if (role === 'manager') {
      if (password !== MANAGER_PASSWORD) {
        setError('Incorrect password')
        return
      }
      onLogin({ role: 'manager', name: 'Manager', outlet: OUTLETS[0] })
    } else {
      const outlet = outletForStaff(staffName)
      if (!outlet) {
        setError('Staff not found')
        return
      }
      onLogin({ role: 'staff', name: staffName, outlet })
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'DM Mono, monospace',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: C.amber,
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            BRETZEL CO.
          </div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: '0.15em' }}>
            OPERATIONS DASHBOARD
          </div>
        </div>

        {/* Login card */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Role toggle */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                fontWeight: 600,
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              ROLE
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {(['staff', 'manager'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setError('') }}
                  style={{
                    background: role === r ? C.amber : C.surface,
                    border: `1px solid ${role === r ? C.amber : C.border}`,
                    borderRadius: 10,
                    color: role === r ? '#000' : C.muted,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 800,
                    padding: '10px',
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {r === 'staff' ? '👤 Staff' : '🔑 Manager'}
                </button>
              ))}
            </div>
          </div>

          {role === 'staff' ? (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                SELECT NAME
              </div>
              <select
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  color: C.text,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  padding: '12px',
                  outline: 'none',
                  width: '100%',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                {ALL_STAFF.map((s) => (
                  <option key={s} value={s} style={{ background: C.surface }}>
                    {s} — {outletForStaff(s)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                PASSWORD
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter manager password"
                style={{
                  background: C.surface,
                  border: `1px solid ${error ? C.red : C.border}`,
                  borderRadius: 10,
                  color: C.text,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  padding: '12px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                background: C.redDim,
                border: `1px solid ${C.red}44`,
                borderRadius: 8,
                color: C.red,
                fontSize: 12,
                fontWeight: 600,
                padding: '8px 12px',
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              background: C.amber,
              border: 'none',
              borderRadius: 10,
              color: '#000',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 800,
              padding: '14px',
              cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            SIGN IN
          </button>
        </div>

        {/* Outlet info */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {OUTLETS.map((o) => (
            <div
              key={o}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11,
                color: C.muted,
              }}
            >
              🏪 {o}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const NAV_TABS: { id: Tab; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'dashboard', label: 'Home', Icon: IconDashboard },
  { id: 'stock', label: 'Stock', Icon: IconPackage },
  { id: 'sales', label: 'Sales', Icon: IconReceipt },
  { id: 'schedule', label: 'Schedule', Icon: IconCalendar },
  { id: 'performance', label: 'Analytics', Icon: IconChart },
]

function MainApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [viewOutlet, setViewOutlet] = useState<Outlet>(user.outlet)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sheetCfg, setSheetCfg] = useState<AppSettings>(() =>
    store.get('bz_settings', DEFAULT_SETTINGS),
  )
  const [staff, setStaff] = useState<Record<Outlet, string[]>>(() => ({ ...STAFF }))
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3000)
  }

  const TAB_LABELS: Record<Tab, string> = {
    dashboard: 'Dashboard',
    stock: 'Stock Count',
    sales: 'Sales Entry',
    schedule: 'Schedule',
    performance: 'Analytics',
    settings: 'Settings',
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab)
  }

  return (
    <div
      style={{
        background: C.bg,
        minHeight: '100vh',
        maxWidth: 430,
        margin: '0 auto',
        fontFamily: 'DM Mono, monospace',
        position: 'relative',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: '0 16px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        {/* Logo */}
        <div style={{ fontSize: 14, fontWeight: 900, color: C.amber, letterSpacing: '0.08em', flexShrink: 0 }}>
          BRETZEL
        </div>

        {/* Outlet selector (center) */}
        {user.role === 'manager' ? (
          <select
            value={viewOutlet}
            onChange={(e) => setViewOutlet(e.target.value as Outlet)}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 8px',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              flex: 1,
              maxWidth: 160,
            }}
          >
            {OUTLETS.map((o) => (
              <option key={o} value={o} style={{ background: C.surface }}>
                🏪 {o}
              </option>
            ))}
          </select>
        ) : (
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              flex: 1,
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            🏪 {viewOutlet}
          </div>
        )}

        {/* Right: settings + logout */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: activeTab === 'settings' ? C.amberDim : 'none',
              border: `1px solid ${activeTab === 'settings' ? C.amber : C.border}`,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              padding: 0,
            }}
          >
            <IconSettings active={activeTab === 'settings'} />
          </button>
          <button
            onClick={onLogout}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.muted,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 8px',
              height: 32,
            }}
          >
            OUT
          </button>
        </div>
      </div>

      {/* Page title */}
      <div
        style={{
          padding: '12px 16px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>
            {TAB_LABELS[activeTab]}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
            {user.name} · {user.role === 'manager' ? 'Manager' : 'Staff'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '8px 16px 80px',
          overflowY: 'auto',
        }}
      >
        {activeTab === 'dashboard' && (
          <DashboardTab user={user} viewOutlet={viewOutlet} onTabChange={handleTabChange} />
        )}
        {activeTab === 'stock' && <StockTab user={user} viewOutlet={viewOutlet} />}
        {activeTab === 'sales' && <SalesTab user={user} viewOutlet={viewOutlet} />}
        {activeTab === 'schedule' && <ScheduleTab user={user} viewOutlet={viewOutlet} />}
        {activeTab === 'performance' && <PerformanceTab user={user} viewOutlet={viewOutlet} />}
        {activeTab === 'settings' && <SettingsTab user={user} />}
      </div>

      {/* Bottom navigation */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          height: 62,
          zIndex: 50,
        }}
      >
        {NAV_TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderTop: `2px solid ${isActive ? C.amber : 'transparent'}`,
                transition: 'border-color 0.15s',
                padding: '6px 4px 8px',
              }}
            >
              <Icon active={isActive} />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: isActive ? C.amber : C.muted,
                  letterSpacing: '0.05em',
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                {label.toUpperCase()}
              </span>
            </button>
          )
        })}
      </div>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sheetCfg={sheetCfg}
        setSheetCfg={setSheetCfg}
        showToast={showToast}
        outlets={OUTLETS}
        staff={staff}
        setStaff={setStaff}
      />

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: toastType === 'success' ? C.green : C.red,
            color: toastType === 'success' ? '#000' : '#fff',
            padding: '10px 18px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13,
            zIndex: 9999,
            maxWidth: 320,
            textAlign: 'center',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Root Component ───────────────────────────────────────────────────────────

function BretzelApp() {
  const [user, setUser] = useState<User | null>(() =>
    store.get<User | null>(STORAGE_KEYS.user, null),
  )

  const handleLogin = (u: User) => {
    store.set(STORAGE_KEYS.user, u)
    setUser(u)
  }

  const handleLogout = () => {
    store.remove(STORAGE_KEYS.user)
    setUser(null)
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return <MainApp user={user} onLogout={handleLogout} />
}
