import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { Outlet, SalesEntry, StockSubmission, AppSettings } from './shared'
import {
  C,
  STOCK_ITEMS,
  STORAGE_KEYS,
  store,
  fmtMyr,
  getStatus,
  getLast7Days,
  buildWaLink,
  DEFAULT_SETTINGS,
} from './shared'
import { Card, StatCard, SectionHeader, Btn, Badge, Sheet, ProgressBar } from './ui'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  user: { role: 'manager' | 'staff'; name: string; outlet: Outlet }
  viewOutlet: Outlet
  onTabChange: (tab: string) => void
}

export function DashboardTab({ user, viewOutlet, onTabChange }: Props) {
  const [mounted, setMounted] = useState(false)
  const [alertSheet, setAlertSheet] = useState(false)
  const settings: AppSettings = store.get(STORAGE_KEYS.settings ?? 'bz_settings', DEFAULT_SETTINGS)

  useEffect(() => setMounted(true), [])

  const days = getLast7Days()

  // Aggregate sales for the viewed outlet
  const allSales: SalesEntry[] = store.get(STORAGE_KEYS.salesEntries(viewOutlet), [])

  // Revenue today
  const todaySales = allSales.filter((s) => s.date === days[days.length - 1])
  const revenueToday = todaySales.reduce(
    (sum, s) => sum + s.cash + s.card + s.duitnow + s.onePay,
    0,
  )

  // 7-day revenue
  const weekRevenue = days.map((d) => {
    const entries = allSales.filter((s) => s.date === d)
    return entries.reduce((sum, s) => sum + s.cash + s.card + s.duitnow + s.onePay, 0)
  })

  // Stock counts for today
  const stockToday: { [id: string]: number } = store.get(
    STORAGE_KEYS.stockCounts(viewOutlet, days[days.length - 1]),
    {},
  )

  const criticalItems = STOCK_ITEMS.filter((item) => {
    const count = stockToday[item.id] ?? 0
    const s = getStatus(count, item.parLevel)
    return s === 'CRITICAL' || s === 'OUT'
  }).map((item) => ({
    ...item,
    count: stockToday[item.id] ?? 0,
    status: getStatus(stockToday[item.id] ?? 0, item.parLevel),
  }))

  // Pending sales approvals (only manager sees all)
  const pendingSales = allSales.filter((s) => !s.approved)

  const activeOutlets = 2

  const statusColor = (s: string) =>
    ({ OK: C.green, LOW: C.amber, CRITICAL: C.orange, OUT: C.red }[s] ?? C.muted)

  const chartData = {
    labels: days.map((d) => {
      const dt = new Date(d + 'T00:00:00')
      return dt.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Revenue (RM)',
        data: weekRevenue,
        backgroundColor: 'rgba(245,158,11,0.8)',
        borderRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => `RM ${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: C.border },
        ticks: { color: C.muted, font: { size: 10, family: 'DM Mono, monospace' } },
      },
      y: {
        grid: { color: C.border },
        ticks: { color: C.muted, font: { size: 10, family: 'DM Mono, monospace' } },
        beginAtZero: true,
      },
    },
  }

  const todayRevPct = settings.dailyTarget > 0 ? (revenueToday / settings.dailyTarget) * 100 : 0

  const waMessage = criticalItems
    .map(
      (i) =>
        `⚠️ ${i.name} — ${i.status} (${i.count}/${i.parLevel} ${i.unit}) [${viewOutlet}]`,
    )
    .join('\n')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard
          label="Revenue Today"
          value={fmtMyr(revenueToday)}
          sub={`${todayRevPct.toFixed(0)}% of RM ${settings.dailyTarget?.toLocaleString() ?? '3,000'} target`}
          accent={revenueToday >= (settings.dailyTarget ?? 3000) ? C.green : C.amber}
          icon="💰"
        />
        <StatCard
          label="Active Outlets"
          value={activeOutlets}
          sub="All operational"
          accent={C.blue}
          icon="🏪"
        />
        <StatCard
          label="Stock Alerts"
          value={criticalItems.length}
          sub={criticalItems.length === 0 ? 'All items OK' : 'Needs attention'}
          accent={criticalItems.length > 0 ? C.red : C.green}
          icon="📦"
        />
        <StatCard
          label="Pending Approval"
          value={pendingSales.length}
          sub={pendingSales.length === 0 ? 'All clear' : 'Sales submissions'}
          accent={pendingSales.length > 0 ? C.orange : C.green}
          icon="✅"
        />
      </div>

      {/* Revenue progress */}
      <Card>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Daily Target Progress</span>
            <span style={{ fontSize: 12, color: C.amber, fontWeight: 700 }}>
              {fmtMyr(revenueToday)} / {fmtMyr(settings.dailyTarget ?? 3000)}
            </span>
          </div>
          <ProgressBar
            value={revenueToday}
            max={settings.dailyTarget ?? 3000}
            color={todayRevPct >= 100 ? C.green : C.amber}
          />
        </div>
      </Card>

      {/* 7-day Chart */}
      <Card>
        <SectionHeader title="7-Day Revenue" />
        {mounted && (
          <div style={{ height: 160 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </Card>

      {/* Critical Stock Alerts */}
      {criticalItems.length > 0 && (
        <Card>
          <SectionHeader
            title="Stock Alerts"
            action={
              settings.managerPhone ? (
                <a
                  href={buildWaLink(
                    settings.managerPhone,
                    `🚨 STOCK ALERT — ${viewOutlet}\n\n${waMessage}\n\nPlease arrange restocking ASAP.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#25D366',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  📱 WhatsApp
                </a>
              ) : (
                <Btn small variant="ghost" onClick={() => onTabChange('settings')}>
                  Set Phone
                </Btn>
              )
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {criticalItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: C.surface,
                  borderRadius: 8,
                  border: `1px solid ${statusColor(item.status)}33`,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {item.count} / {item.parLevel} {item.unit}
                  </div>
                </div>
                <Badge
                  label={item.status}
                  color={statusColor(item.status)}
                  bg={statusColor(item.status) + '22'}
                />
              </div>
            ))}
            {criticalItems.length > 5 && (
              <button
                onClick={() => onTabChange('stock')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.amber,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: '4px 0',
                  textAlign: 'left',
                }}
              >
                +{criticalItems.length - 5} more → View Stock
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Pending Approvals */}
      {user.role === 'manager' && pendingSales.length > 0 && (
        <Card>
          <SectionHeader
            title="Pending Approvals"
            action={
              <Btn small variant="outline" onClick={() => onTabChange('sales')}>
                View All
              </Btn>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingSales.slice(0, 3).map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: C.surface,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                    {s.submittedBy}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {s.date} · {fmtMyr(s.cash + s.card + s.duitnow + s.onePay)}
                  </div>
                </div>
                <Badge label="PENDING" color={C.amber} bg={C.amberDim} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {criticalItems.length === 0 && pendingSales.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
            ✅ All clear — no alerts or pending items
          </div>
        </Card>
      )}

      <Sheet open={alertSheet} onClose={() => setAlertSheet(false)} title="All Stock Alerts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {criticalItems.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '10px 12px',
                background: C.card,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: C.text }}>{item.name}</span>
                <Badge
                  label={item.status}
                  color={statusColor(item.status)}
                  bg={statusColor(item.status) + '22'}
                />
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {item.count} / {item.parLevel} {item.unit} · {item.category}
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
