import React, { useState } from 'react'
import type { AppSettings, Outlet } from './shared'
import {
  C,
  OUTLETS,
  STORAGE_KEYS,
  store,
  DEFAULT_SETTINGS,
} from './shared'
import { Btn, Card, Input, SectionHeader, Sheet, Divider } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  sheetCfg: AppSettings
  setSheetCfg: React.Dispatch<React.SetStateAction<AppSettings>>
  showToast: (msg: string, type?: 'success' | 'error') => void
  outlets: Outlet[]
  staff: Record<Outlet, string[]>
  setStaff: React.Dispatch<React.SetStateAction<Record<Outlet, string[]>>>
}

export function SettingsSheet({
  open,
  onClose,
  sheetCfg,
  setSheetCfg,
  showToast,
  outlets,
  staff,
  setStaff,
}: Props) {
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffOutlet, setNewStaffOutlet] = useState<Outlet>(outlets[0])

  const update = (key: keyof AppSettings, val: string | number) => {
    setSheetCfg((prev) => ({ ...prev, [key]: val }))
  }

  const handleSave = () => {
    store.set('bz_settings', sheetCfg)
    showToast('Settings saved!')
    onClose()
  }

  const handleAddStaff = () => {
    const name = newStaffName.trim()
    if (!name) {
      showToast('Enter a staff name', 'error')
      return
    }
    if (staff[newStaffOutlet]?.includes(name)) {
      showToast('Staff already exists at this outlet', 'error')
      return
    }
    setStaff((prev) => ({
      ...prev,
      [newStaffOutlet]: [...(prev[newStaffOutlet] || []), name],
    }))
    setNewStaffName('')
    showToast(`Added ${name} to ${newStaffOutlet}`)
  }

  const handleRemoveStaff = (outlet: Outlet, name: string) => {
    setStaff((prev) => ({
      ...prev,
      [outlet]: prev[outlet].filter((s) => s !== name),
    }))
    showToast(`Removed ${name} from ${outlet}`)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* App Settings */}
        <Card>
          <SectionHeader title="App Settings" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Manager WhatsApp Number"
              value={sheetCfg.managerPhone}
              onChange={(v) => update('managerPhone', v)}
              placeholder="60123456789"
            />
            <div style={{ fontSize: 11, color: C.muted, marginTop: -6 }}>
              International format, no + sign (e.g. 60123456789)
            </div>
            <Input
              label="Daily Sales Target (RM)"
              type="number"
              value={sheetCfg.dailyTarget}
              onChange={(v) => update('dailyTarget', Number(v))}
              min={0}
              step={100}
            />
          </div>
        </Card>

        {/* Google Sheets Config */}
        <Card>
          <SectionHeader title="Google Sheets Sync" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Spreadsheet ID"
              value={sheetCfg.spreadsheetId}
              onChange={(v) => update('spreadsheetId', v)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            />
            <Input
              label="Google Sheets API Key"
              value={sheetCfg.sheetsApiKey}
              onChange={(v) => update('sheetsApiKey', v)}
              placeholder="AIzaSy..."
            />
          </div>
        </Card>

        {/* Staff Management */}
        <Card>
          <SectionHeader title="Staff Management" />
          {outlets.map((outlet) => (
            <div key={outlet} style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  color: C.amber,
                  fontWeight: 700,
                  marginBottom: 6,
                  letterSpacing: '0.05em',
                }}
              >
                {outlet}
              </div>
              {(staff[outlet] || []).map((name) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    background: C.surface,
                    borderRadius: 6,
                    marginBottom: 4,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <span style={{ fontSize: 13, color: C.text }}>{name}</span>
                  <button
                    onClick={() => handleRemoveStaff(outlet, name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.red,
                      cursor: 'pointer',
                      fontSize: 16,
                      fontFamily: 'inherit',
                      padding: '0 4px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {(staff[outlet] || []).length === 0 && (
                <div style={{ fontSize: 12, color: C.muted, padding: '4px 0' }}>
                  No staff assigned
                </div>
              )}
            </div>
          ))}

          <Divider />

          {/* Add staff */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.06em' }}>
              ADD STAFF
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Staff name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStaff()}
                style={{
                  flex: 1,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  padding: '8px 12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <select
                value={newStaffOutlet}
                onChange={(e) => setNewStaffOutlet(e.target.value as Outlet)}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                  fontFamily: 'inherit',
                  fontSize: 12,
                  padding: '8px',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                {outlets.map((o) => (
                  <option key={o} value={o} style={{ background: C.surface }}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <Btn small onClick={handleAddStaff}>
              + Add Staff
            </Btn>
          </div>
        </Card>

        {/* Save */}
        <Btn full onClick={handleSave}>
          Save Settings
        </Btn>
      </div>
    </Sheet>
  )
}
