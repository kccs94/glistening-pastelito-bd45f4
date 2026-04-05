import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import type { Outlet, SalesEntry, AttendanceEntry, AttendanceStatus } from './shared'
import {
  C,
  OUTLETS,
  STAFF,
  STORAGE_KEYS,
  store,
  fmtMyr,
  fmtDate,
  getLastNDays,
  DEFAULT_SETTINGS,
  AppSettings,
} from './shared'
import { Card, SectionHeader, StatCard } from './ui'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface Props {
  user: { role: 'manager' | 'staff'; name: string; outlet: Outlet }
  viewOutlet: Outlet
}

type Period = 7 | 14 | 30 | 90

const ATT_ORDER: AttendanceStatus[] = ['Present', 'Absent', 'MC', 'Late', 'Half Day', 'OT']

export function PerformanceTab({ user, viewOutlet }: Props) {
  const [period, setPeriod] = useState<Period>(7)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const settings: AppSettings = store.get('bz_settings', DEFAULT_SETTINGS)
  const days = getLastNDays(period)

  // Aggregate sales for viewed outlet
  const allSales: SalesEntry[] = store.get(STORAGE_KEYS.salesEntries(viewOutlet), [])
  const periodSales = allSales.filter((s) => days.includes(s.date))

  // For manager: also aggregate other outlet
  const otherOutlet = OUTLETS.find((o) => o !== viewOutlet)!
  const otherSales: SalesEntry[] = user.role === 'manager'
    ? store.get(STORAGE_KEYS.salesEntries(otherOutlet), []).filter((s: SalesEntry) => days.includes(s.date))
    : []

  const totalRevenue = periodSales.reduce(
    (s, e) => s + e.cash + e.card + e.duitnow + e.onePay,
    0,
  )
  const totalTarget = (settings.dailyTarget ?? 3000) * period
  const avgDaily = period > 0 ? totalRevenue / period : 0

  // Revenue by day (bar chart)
  const revenueByDay = days.map((d) => {
    const entries = periodSales.filter((s) => s.date === d)
    return entries.reduce((s, e) => s + e.cash + e.card + e.duitnow + e.onePay, 0)
  })

  const revenueByDayOther = days.map((d) => {
    const entries = otherSales.filter((s: SalesEntry) => s.date === d)
    return entries.reduce((s: number, e: SalesEntry) => s + e.cash + e.card + e.duitnow + e.onePay, 0)
  })

  const dayLabels = days.map((d) => {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
  })

  const barData = {
    labels: dayLabels,
    datasets: [
      {
        label: viewOutlet,
        data: revenueByDay,
        backgroundColor: 'rgba(245,158,11,0.8)',
        borderRadius: 4,
      },
      ...(user.role === 'manager'
        ? [
            {
              label: otherOutlet,
              data: revenueByDayOther,
              backgroundColor: 'rgba(59,130,246,0.8)',
              borderRadius: 4,
            },
          ]
        : []),
    ],
  }

  // Payment mix (doughnut)
  const payTotals = {
    Cash: periodSales.reduce((s, e) => s + e.cash, 0),
    Card: periodSales.reduce((s, e) => s + e.card, 0),
    DuitNow: periodSales.reduce((s, e) => s + e.duitnow, 0),
    '1Pay': periodSales.reduce((s, e) => s + e.onePay, 0),
  }

  const doughnutData = {
    labels: Object.keys(payTotals),
    datasets: [
      {
        data: Object.values(payTotals),
        backgroundColor: [
          'rgba(34,197,94,0.8)',
          'rgba(59,130,246,0.8)',
          'rgba(245,158,11,0.8)',
          'rgba(168,85,247,0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  // Top sales days
  const topDays = days
    .map((d) => ({
      date: d,
      revenue: periodSales
        .filter((s) => s.date === d)
        .reduce((s, e) => s + e.cash + e.card + e.duitnow + e.onePay, 0),
    }))
    .filter((d) => d.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Attendance summary
  const allAtt: AttendanceEntry[] = store.get(STORAGE_KEYS.attendance(viewOutlet), [])
  const periodAtt = allAtt.filter((a) => days.includes(a.date) && a.outlet === viewOutlet)
  const staffList =
    (settings.staffList?.[viewOutlet] ?? []).length > 0
      ? settings.staffList[viewOutlet]
      : STAFF[viewOutlet]

  const attSummary = staffList.map((staff) => {
    const staffAtt = periodAtt.filter((a) => a.staff === staff)
    const counts: Partial<Record<AttendanceStatus, number>> = {}
    ATT_ORDER.forEach((s) => {
      counts[s] = staffAtt.filter((a) => a.status === s).length
    })
    const otTotal = staffAtt
      .filter((a) => a.status === 'OT')
      .reduce((sum, a) => sum + (a.otHours ?? 0), 0)
    return { staff, counts, otTotal }
  })

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: C.muted, font: { size: 11, family: 'DM Mono, monospace' } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number }; dataset: { label: string } }) =>
            `${ctx.dataset.label}: RM ${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: C.border },
        ticks: { color: C.muted, font: { size: 9, family: 'DM Mono, monospace' } },
      },
      y: {
        grid: { color: C.border },
        ticks: { color: C.muted, font: { size: 9, family: 'DM Mono, monospace' } },
        beginAtZero: true,
      },
    },
  }

  const pctTarget = totalTarget > 0 ? Math.min(100, (totalRevenue / totalTarget) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 6 }}>
        {([7, 14, 30, 90] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              flex: 1,
              background: period === p ? C.amber : C.card,
              color: period === p ? '#000' : C.muted,
              border: `1px solid ${period === p ? C.amber : C.border}`,
              borderRadius: 8,
              padding: '8px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {p}d
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard
          label="Total Revenue"
          value={fmtMyr(totalRevenue)}
          sub={`${period}-day period`}
          accent={C.amber}
        />
        <StatCard
          label="Avg Daily"
          value={fmtMyr(avgDaily)}
          sub="Per day"
          accent={C.blue}
        />
      </div>

      {/* Target progress */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.muted }}>Target vs Actual ({period} days)</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: pctTarget >= 100 ? C.green : C.amber }}>
            {pctTarget.toFixed(1)}%
          </span>
        </div>
        <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pctTarget}%`,
              background: pctTarget >= 100 ? C.green : C.amber,
              borderRadius: 3,
              transition: 'width 0.3s',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: C.muted }}>Actual: {fmtMyr(totalRevenue)}</span>
          <span style={{ fontSize: 11, color: C.muted }}>Target: {fmtMyr(totalTarget)}</span>
        </div>
      </Card>

      {/* Revenue chart */}
      {mounted && (
        <Card>
          <SectionHeader title={`Revenue — Last ${period} Days`} />
          <div style={{ height: 180 }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </Card>
      )}

      {/* Payment mix */}
      {mounted && totalRevenue > 0 && (
        <Card>
          <SectionHeader title="Payment Mix" />
          <div style={{ height: 180 }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: C.muted,
                      font: { size: 11, family: 'DM Mono, monospace' },
                      padding: 10,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx: { label: string; parsed: number }) =>
                        `${ctx.label}: ${fmtMyr(ctx.parsed)}`,
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
            {Object.entries(payTotals).map(([method, amt]) => (
              <div
                key={method}
                style={{
                  background: C.surface,
                  borderRadius: 6,
                  padding: '6px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 11, color: C.muted }}>{method}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                  {totalRevenue > 0 ? ((amt / totalRevenue) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top sales days */}
      {topDays.length > 0 && (
        <Card>
          <SectionHeader title="Top Sales Days" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topDays.map((d, i) => (
              <div
                key={d.date}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                  borderBottom: i < topDays.length - 1 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: i === 0 ? C.amber : C.muted,
                    width: 20,
                    textAlign: 'center',
                  }}
                >
                  #{i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: C.text }}>{fmtDate(d.date)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>
                  {fmtMyr(d.revenue)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attendance summary */}
      <Card>
        <SectionHeader title={`Attendance Summary — ${period} Days`} />
        {attSummary.map(({ staff, counts, otTotal }) => (
          <div
            key={staff}
            style={{
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              {staff}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ATT_ORDER.map((status) => {
                const count = counts[status] ?? 0
                if (count === 0) return null
                const colors: Record<AttendanceStatus, string> = {
                  Present: C.green,
                  Absent: C.red,
                  MC: C.orange,
                  Late: C.amber,
                  'Half Day': C.blue,
                  OT: '#A855F7',
                }
                return (
                  <div
                    key={status}
                    style={{
                      background: colors[status] + '22',
                      border: `1px solid ${colors[status]}44`,
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 11,
                      color: colors[status],
                      fontWeight: 700,
                    }}
                  >
                    {status}: {count}
                    {status === 'OT' && otTotal > 0 && ` (${otTotal}h)`}
                  </div>
                )
              })}
              {Object.values(counts).every((v) => v === 0) && (
                <span style={{ fontSize: 11, color: C.muted }}>No records</span>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
