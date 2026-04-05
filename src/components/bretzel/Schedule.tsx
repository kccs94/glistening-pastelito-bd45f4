import React, { useState } from 'react'
import type { Outlet, ShiftType, AttendanceStatus, AttendanceEntry, ScheduleEntry, AppSettings } from './shared'
import {
  C,
  DAYS,
  SHIFT_TYPES,
  ATTENDANCE_STATUSES,
  STORAGE_KEYS,
  store,
  getMondayOfWeek,
  getWeekDates,
  todayStr,
  fmtDate,
  genId,
  DEFAULT_SETTINGS,
} from './shared'
import { Badge, Btn, Card, SectionHeader, Sheet } from './ui'

interface Props {
  user: { role: 'manager' | 'staff'; name: string; outlet: Outlet }
  viewOutlet: Outlet
}

type Shifts = { [staff: string]: { [day: string]: ShiftType } }

const SHIFT_COLORS: Record<ShiftType, { color: string; bg: string }> = {
  Opening: { color: C.amber, bg: C.amberDim },
  Closing: { color: C.blue, bg: C.blueDim },
  'Full Day': { color: C.green, bg: C.greenDim },
  'Off Day': { color: C.muted, bg: C.border },
}

const ATT_COLORS: Record<AttendanceStatus, string> = {
  Present: C.green,
  Absent: C.red,
  MC: C.orange,
  Late: C.amber,
  'Half Day': C.blue,
  OT: '#A855F7',
}

export function ScheduleTab({ user, viewOutlet }: Props) {
  const today = todayStr()
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()))
  const weekDates = getWeekDates(weekStart)

  // ── Always read staff from settings so edits in Settings reflect here ──
  const settings: AppSettings = store.get('bz_settings', DEFAULT_SETTINGS)
  const staffList: string[] =
    (settings.staffList?.[viewOutlet] ?? []).length > 0
      ? settings.staffList[viewOutlet]
      : DEFAULT_SETTINGS.staffList[viewOutlet]

  const schedKey = STORAGE_KEYS.schedule(viewOutlet, weekStart)
  const [shifts, setShifts] = useState<Shifts>(() => {
    const saved: ScheduleEntry | null = store.get(schedKey, null)
    return saved ? saved.shifts : {}
  })

  const attKey = STORAGE_KEYS.attendance(viewOutlet)
  const [attendance, setAttendance] = useState<AttendanceEntry[]>(() =>
    store.get(attKey, []),
  )

  const [attSheet, setAttSheet] = useState<{ date: string; staff: string } | null>(null)
  const [otHours, setOtHours] = useState<{ [staff: string]: string }>({})
  const [toast, setToast] = useState('')

  const saveShifts = (updated: Shifts) => {
    setShifts(updated)
    const entry: ScheduleEntry = {
      weekStart,
      outlet: viewOutlet,
      shifts: updated,
    }
    store.set(schedKey, entry)
  }

  const setShift = (staff: string, date: string, shift: ShiftType) => {
    const updated = {
      ...shifts,
      [staff]: { ...(shifts[staff] ?? {}), [date]: shift },
    }
    saveShifts(updated)
  }

  const getShift = (staff: string, date: string): ShiftType =>
    shifts[staff]?.[date] ?? 'Off Day'

  const getAttendance = (staff: string, date: string): AttendanceEntry | undefined =>
    attendance.find((a) => a.staff === staff && a.date === date && a.outlet === viewOutlet)

  const markAttendance = (
    staff: string,
    date: string,
    status: AttendanceStatus,
    ot = 0,
  ) => {
    const existing = attendance.findIndex(
      (a) => a.staff === staff && a.date === date && a.outlet === viewOutlet,
    )
    let updated: AttendanceEntry[]
    const entry: AttendanceEntry = {
      date,
      outlet: viewOutlet,
      staff,
      status,
      otHours: ot,
    }
    if (existing >= 0) {
      updated = [...attendance]
      updated[existing] = entry
    } else {
      updated = [...attendance, entry]
    }
    setAttendance(updated)
    store.set(attKey, updated)
    setAttSheet(null)
    setToast(`${staff} marked as ${status}`)
    setTimeout(() => setToast(''), 2500)
  }

  const prevWeek = () => {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    const newWeek = d.toISOString().split('T')[0]
    setWeekStart(newWeek)
    const saved: ScheduleEntry | null = store.get(STORAGE_KEYS.schedule(viewOutlet, newWeek), null)
    setShifts(saved ? saved.shifts : {})
  }

  const nextWeek = () => {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + 7)
    const newWeek = d.toISOString().split('T')[0]
    setWeekStart(newWeek)
    const saved: ScheduleEntry | null = store.get(STORAGE_KEYS.schedule(viewOutlet, newWeek), null)
    setShifts(saved ? saved.shifts : {})
  }

  const isToday = (date: string) => date === today

  // Today's attendance summary
  const todayAtt = staffList.map((s) => ({
    staff: s,
    att: getAttendance(s, today),
  }))

  const weekLabel = () => {
    const start = new Date(weekStart + 'T00:00:00')
    const end = new Date(weekDates[6] + 'T00:00:00')
    return `${start.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Today's Attendance Quick Mark */}
      <Card>
        <SectionHeader title={`Today's Attendance — ${fmtDate(today)}`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {staffList.length === 0 && (
            <div style={{ fontSize: 12, color: C.muted, padding: '8px 0' }}>
              No staff assigned. Add staff in Settings.
            </div>
          )}
          {todayAtt.map(({ staff, att }) => (
            <div
              key={staff}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{staff}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {att ? (
                  <>
                    <Badge label={att.status} color={ATT_COLORS[att.status]} bg={ATT_COLORS[att.status] + '22'} />
                    {att.status === 'OT' && (
                      <span style={{ fontSize: 11, color: C.muted }}>{att.otHours}h OT</span>
                    )}
                  </>
                ) : (
                  <Badge label="Not Marked" color={C.muted} bg={C.border} />
                )}
                {(user.role === 'manager' || user.name === staff) && (
                  <Btn small variant="ghost" onClick={() => setAttSheet({ date: today, staff })}>
                    Mark
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Schedule Grid */}
      <Card style={{ padding: 0 }}>
        {/* Week navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <button onClick={prevWeek} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 10px', fontSize: 16 }}>‹</button>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{weekLabel()}</span>
          <button onClick={nextWeek} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 10px', fontSize: 16 }}>›</button>
        </div>

        {/* Scrollable grid */}
        <div style={{ overflowX: 'auto', padding: 14 }}>
          {/* Day headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)`,
              gap: 4,
              marginBottom: 6,
              minWidth: 400,
            }}
          >
            <div />
            {weekDates.map((date, i) => (
              <div
                key={date}
                style={{
                  textAlign: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                  color: isToday(date) ? C.amber : C.muted,
                  padding: '2px 0',
                  borderRadius: 4,
                  background: isToday(date) ? C.amberDim : 'transparent',
                }}
              >
                <div>{DAYS[i]}</div>
                <div style={{ fontSize: 8, opacity: 0.7 }}>
                  {new Date(date + 'T00:00:00').getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Staff rows */}
          {staffList.length === 0 && (
            <div style={{ fontSize: 12, color: C.muted, padding: '12px 0', textAlign: 'center' }}>
              No staff — add via Settings
            </div>
          )}
          {staffList.map((staff) => (
            <div
              key={staff}
              style={{
                display: 'grid',
                gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)`,
                gap: 4,
                marginBottom: 4,
                minWidth: 400,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.text,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  paddingRight: 4,
                }}
              >
                {staff.split(' ')[0]}
              </div>
              {weekDates.map((date) => {
                const shift = getShift(staff, date)
                const sc = SHIFT_COLORS[shift]
                return (
                  <div key={date} style={{ position: 'relative' }}>
                    {user.role === 'manager' ? (
                      <select
                        value={shift}
                        onChange={(e) => setShift(staff, date, e.target.value as ShiftType)}
                        style={{
                          width: '100%',
                          background: sc.bg,
                          border: `1px solid ${sc.color}44`,
                          borderRadius: 6,
                          color: sc.color,
                          fontFamily: 'inherit',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '3px 2px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          outline: 'none',
                          appearance: 'none',
                        }}
                      >
                        {SHIFT_TYPES.map((s) => (
                          <option key={s} value={s} style={{ background: C.surface, color: C.text }}>
                            {s === 'Full Day' ? 'Full' : s === 'Off Day' ? 'Off' : s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        style={{
                          background: sc.bg,
                          border: `1px solid ${sc.color}44`,
                          borderRadius: 6,
                          color: sc.color,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '4px 2px',
                          textAlign: 'center',
                        }}
                      >
                        {shift === 'Full Day' ? 'Full' : shift === 'Off Day' ? 'Off' : shift}
                      </div>
                    )}
                    {/* Attendance dot */}
                    {(() => {
                      const att = getAttendance(staff, date)
                      if (!att) return null
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            top: -3,
                            right: -3,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: ATT_COLORS[att.status],
                            border: `1px solid ${C.card}`,
                          }}
                        />
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          {SHIFT_TYPES.map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: SHIFT_COLORS[s].color }} />
              <span style={{ fontSize: 10, color: C.muted }}>{s}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Attendance History */}
      <Card>
        <SectionHeader title="Attendance Log" />
        {(() => {
          const recent = [...attendance]
            .filter((a) => a.outlet === viewOutlet)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 10)
          if (recent.length === 0) {
            return (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '12px 0' }}>
                No attendance records yet
              </div>
            )
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recent.map((a, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : 'none' }}
                >
                  <div>
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{a.staff}</span>
                    <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>{fmtDate(a.date)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {a.status === 'OT' && (
                      <span style={{ fontSize: 11, color: '#A855F7' }}>{a.otHours}h</span>
                    )}
                    <Badge label={a.status} color={ATT_COLORS[a.status]} bg={ATT_COLORS[a.status] + '22'} />
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </Card>

      {toast && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: C.green, color: '#000', padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* Attendance mark sheet */}
      <Sheet open={!!attSheet} onClose={() => setAttSheet(null)} title={attSheet ? `Mark — ${attSheet.staff}` : ''}>
        {attSheet && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{fmtDate(attSheet.date)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ATTENDANCE_STATUSES.filter((s) => s !== 'OT').map((status) => (
                <button
                  key={status}
                  onClick={() => markAttendance(attSheet.staff, attSheet.date, status)}
                  style={{ background: ATT_COLORS[status] + '22', border: `1px solid ${ATT_COLORS[status]}44`, borderRadius: 8, color: ATT_COLORS[status], fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                >
                  {status}
                </button>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>OT (Overtime)</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="OT Hours"
                  min={0}
                  max={12}
                  step={0.5}
                  value={otHours[attSheet.staff] ?? ''}
                  onChange={(e) => setOtHours((prev) => ({ ...prev, [attSheet.staff]: e.target.value }))}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'inherit', fontSize: 14, padding: '8px 12px', outline: 'none', width: 80 }}
                />
                <Btn onClick={() => markAttendance(attSheet.staff, attSheet.date, 'OT', Number(otHours[attSheet.staff] ?? 0))}>
                  Mark OT
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
