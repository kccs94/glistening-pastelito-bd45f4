import React, { useState } from 'react'
import type { AppSettings, Outlet, SalesEntry, StockSubmission, AttendanceEntry } from './shared'
import {
  C,
  OUTLETS,
  STORAGE_KEYS,
  store,
  DEFAULT_SETTINGS,
  todayStr,
  getLastNDays,
} from './shared'
import { Btn, Card, Input, SectionHeader, Divider } from './ui'

interface Props {
  user: { role: 'manager' | 'staff'; name: string; outlet: Outlet }
}

export function SettingsTab({ user }: Props) {
  const [settings, setSettings] = useState<AppSettings>(() =>
    store.get('bz_settings', DEFAULT_SETTINGS),
  )
  const [saved, setSaved] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: string }>({})

  const save = () => {
    store.set('bz_settings', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const update = (key: keyof AppSettings, val: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: val }))
  }

  const syncToSheets = async (tabName: string, getData: () => unknown[][]) => {
    if (!settings.sheetsApiKey || !settings.spreadsheetId) {
      setSyncStatus((prev) => ({
        ...prev,
        [tabName]: '❌ Configure API key and Spreadsheet ID first',
      }))
      return
    }

    setSyncStatus((prev) => ({ ...prev, [tabName]: '⏳ Syncing...' }))

    try {
      const values = getData()
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}/values/${encodeURIComponent(tabName)}:append?valueInputOption=USER_ENTERED&insertDataOption=OVERWRITE&key=${settings.sheetsApiKey}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      })

      if (res.ok) {
        setSyncStatus((prev) => ({
          ...prev,
          [tabName]: `✅ Synced ${values.length - 1} rows`,
        }))
      } else {
        const err = await res.json()
        setSyncStatus((prev) => ({
          ...prev,
          [tabName]: `❌ ${err?.error?.message ?? 'Sync failed'}`,
        }))
      }
    } catch (e) {
      setSyncStatus((prev) => ({
        ...prev,
        [tabName]: '❌ Network error — check CORS or API key',
      }))
    }
  }

  const getSalesData = (): unknown[][] => {
    const rows: unknown[][] = [
      ['Date', 'Outlet', 'Cash', 'Card', 'DuitNow', '1Pay', 'Total', 'Expenses', 'SubmittedBy', 'Approved'],
    ]
    OUTLETS.forEach((outlet) => {
      const entries: SalesEntry[] = store.get(STORAGE_KEYS.salesEntries(outlet), [])
      entries.forEach((e) => {
        rows.push([
          e.date,
          e.outlet,
          e.cash,
          e.card,
          e.duitnow,
          e.onePay,
          e.cash + e.card + e.duitnow + e.onePay,
          e.expenses.reduce((s, x) => s + x.amt, 0),
          e.submittedBy,
          e.approved ? 'Yes' : 'No',
        ])
      })
    })
    return rows
  }

  const getStockData = (): unknown[][] => {
    const rows: unknown[][] = [['Date', 'Outlet', 'ItemID', 'ItemName', 'Count', 'SubmittedBy']]
    const today = todayStr()
    OUTLETS.forEach((outlet) => {
      const history: StockSubmission[] = store.get(STORAGE_KEYS.stockHistory(outlet), [])
      history.forEach((h) => {
        Object.entries(h.counts).forEach(([id, count]) => {
          rows.push([h.date, h.outlet, id, id, count, h.submittedBy])
        })
      })
    })
    return rows
  }

  const getAttendanceData = (): unknown[][] => {
    const rows: unknown[][] = [['Date', 'Outlet', 'Staff', 'Status', 'OT Hours']]
    OUTLETS.forEach((outlet) => {
      const att: AttendanceEntry[] = store.get(STORAGE_KEYS.attendance(outlet), [])
      att.forEach((a) => {
        rows.push([a.date, a.outlet, a.staff, a.status, a.otHours ?? 0])
      })
    })
    return rows
  }

  const getAlertsData = (): unknown[][] => {
    const rows: unknown[][] = [['Date', 'Outlet', 'Message']]
    // Placeholder — alerts would be logged separately in production
    rows.push([todayStr(), 'All', 'Manual sync triggered'])
    return rows
  }

  const clearAllData = () => {
    if (!window.confirm('⚠️ This will clear ALL local data. Are you sure?')) return
    const keys = Object.keys(window.localStorage).filter((k) => k.startsWith('bz_'))
    keys.forEach((k) => {
      if (k !== 'bz_settings' && k !== 'bz_user') {
        window.localStorage.removeItem(k)
      }
    })
    window.alert('Data cleared. Reload the page.')
  }

  const isManager = user.role === 'manager'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Google Sheets Config */}
      <Card>
        <SectionHeader title="Google Sheets Sync" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Spreadsheet ID"
            value={settings.spreadsheetId}
            onChange={(v) => update('spreadsheetId', v)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          />
          <Input
            label="Google Sheets API Key"
            value={settings.sheetsApiKey}
            onChange={(v) => update('sheetsApiKey', v)}
            placeholder="AIzaSy..."
          />
          <div
            style={{
              background: C.surface,
              borderRadius: 8,
              padding: 12,
              fontSize: 11,
              color: C.muted,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: C.amber }}>Setup:</strong> Share your Google Sheet with
            editing access or use a Service Account. The sheet must have tabs named "Sales",
            "Stock", "Attendance", and "Alerts".
          </div>
        </div>
      </Card>

      {/* Sync buttons */}
      <Card>
        <SectionHeader title="Sync Data" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'Sales', getData: getSalesData },
            { name: 'Stock', getData: getStockData },
            { name: 'Attendance', getData: getAttendanceData },
            { name: 'Alerts', getData: getAlertsData },
          ].map(({ name, getData }) => (
            <div key={name}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <Btn
                  small
                  variant="outline"
                  onClick={() => syncToSheets(name, getData)}
                >
                  ↑ Sync {name}
                </Btn>
                {syncStatus[name] && (
                  <span style={{ fontSize: 11, color: C.muted }}>{syncStatus[name]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* App Settings */}
      <Card>
        <SectionHeader title="App Settings" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Manager WhatsApp Number"
            value={settings.managerPhone}
            onChange={(v) => update('managerPhone', v)}
            placeholder="60123456789"
          />
          <div style={{ fontSize: 11, color: C.muted, marginTop: -6 }}>
            International format, no + sign (e.g. 60123456789)
          </div>
          {isManager && (
            <Input
              label="Daily Sales Target (RM)"
              type="number"
              value={settings.dailyTarget}
              onChange={(v) => update('dailyTarget', Number(v))}
              min={0}
              step={100}
            />
          )}
        </div>
      </Card>

      <Btn full onClick={save} variant={saved ? 'success' : 'primary'}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </Btn>

      <Divider />

      {/* Data management */}
      <Card>
        <SectionHeader title="Data Management" />
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          All data is stored locally on this device using browser storage.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn
            small
            variant="ghost"
            onClick={() => {
              const data = {
                sales: OUTLETS.map((o) => ({ outlet: o, entries: store.get(STORAGE_KEYS.salesEntries(o), []) })),
                stock: OUTLETS.map((o) => ({ outlet: o, history: store.get(STORAGE_KEYS.stockHistory(o), []) })),
                attendance: OUTLETS.map((o) => ({ outlet: o, entries: store.get(STORAGE_KEYS.attendance(o), []) })),
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `bretzel-backup-${todayStr()}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export Backup
          </Btn>
          {isManager && (
            <Btn small variant="danger" onClick={clearAllData}>
              Clear All Data
            </Btn>
          )}
        </div>
      </Card>

      {/* App info */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: C.muted,
          padding: '8px 0',
        }}
      >
        BRETZEL CO. Operations Dashboard · v1.0
        <br />
        <span style={{ color: C.border }}>Data stored locally · {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}
