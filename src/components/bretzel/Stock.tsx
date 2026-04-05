import React, { useState, useEffect } from 'react'
import type { Outlet, StockStatus, StockCategory, StockSubmission, AppSettings } from './shared'
import {
  C,
  STOCK_ITEMS,
  CATEGORIES,
  STORAGE_KEYS,
  store,
  getStatus,
  statusColor,
  statusBg,
  todayStr,
  fmtDate,
  buildWaLink,
  genId,
  DEFAULT_SETTINGS,
} from './shared'
import {
  Badge,
  Btn,
  Card,
  SectionHeader,
  Sheet,
  ProgressBar,
  Input,
} from './ui'

interface Props {
  user: { role: 'manager' | 'staff'; name: string; outlet: Outlet }
  viewOutlet: Outlet
}

export function StockTab({ user, viewOutlet }: Props) {
  const today = todayStr()
  const settings: AppSettings = store.get('bz_settings', DEFAULT_SETTINGS)

  const [counts, setCounts] = useState<{ [id: string]: number }>(() =>
    store.get(STORAGE_KEYS.stockCounts(viewOutlet, today), {}),
  )
  const [category, setCategory] = useState<StockCategory | 'All'>('All')
  const [search, setSearch] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [confirmSheet, setConfirmSheet] = useState(false)
  const [toast, setToast] = useState('')
  const [history, setHistory] = useState<StockSubmission[]>(() =>
    store.get(STORAGE_KEYS.stockHistory(viewOutlet), []),
  )

  // Persist counts on change
  useEffect(() => {
    store.set(STORAGE_KEYS.stockCounts(viewOutlet, today), counts)
  }, [counts, viewOutlet, today])

  const setCount = (id: string, val: number) => {
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, val) }))
  }

  const filtered = STOCK_ITEMS.filter((item) => {
    const matchCat = category === 'All' || item.category === category
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const criticalItems = STOCK_ITEMS.filter((item) => {
    const s = getStatus(counts[item.id] ?? 0, item.parLevel)
    return s === 'CRITICAL' || s === 'OUT'
  })

  const lowItems = STOCK_ITEMS.filter((item) => {
    const s = getStatus(counts[item.id] ?? 0, item.parLevel)
    return s === 'LOW'
  })

  const countedItems = STOCK_ITEMS.filter((item) => counts[item.id] !== undefined)

  const waMessage =
    `🚨 STOCK ALERT — ${viewOutlet}\nDate: ${today}\n\n` +
    criticalItems
      .map(
        (i) =>
          `• ${i.name}: ${counts[i.id] ?? 0}/${i.parLevel} ${i.unit} [${getStatus(counts[i.id] ?? 0, i.parLevel)}]`,
      )
      .join('\n') +
    '\n\nPlease arrange restocking.'

  const handleSubmit = () => {
    const submission: StockSubmission = {
      id: genId(),
      date: today,
      outlet: viewOutlet,
      counts: { ...counts },
      submittedBy: user.name,
      submittedAt: new Date().toISOString(),
    }
    const updated = [submission, ...history].slice(0, 30)
    setHistory(updated)
    store.set(STORAGE_KEYS.stockHistory(viewOutlet), updated)
    setConfirmSheet(false)
    setToast('Stock count submitted!')
    setTimeout(() => setToast(''), 3000)
  }

  const statusCounts = {
    OK: STOCK_ITEMS.filter((i) => getStatus(counts[i.id] ?? 0, i.parLevel) === 'OK').length,
    LOW: lowItems.length,
    CRITICAL: criticalItems.filter((i) => getStatus(counts[i.id] ?? 0, i.parLevel) === 'CRITICAL').length,
    OUT: criticalItems.filter((i) => getStatus(counts[i.id] ?? 0, i.parLevel) === 'OUT').length,
  }

  if (showHistory) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Btn small variant="ghost" onClick={() => setShowHistory(false)}>
            ← Back
          </Btn>
          <span style={{ fontWeight: 800, fontSize: 14, color: C.text }}>Submission History</span>
        </div>
        {history.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '20px 0' }}>
              No submissions yet
            </div>
          </Card>
        )}
        {history.map((h) => (
          <Card key={h.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{fmtDate(h.date)}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{h.submittedBy} · {new Date(h.submittedAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <Badge label={h.outlet} color={C.blue} bg={C.blueDim} />
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {Object.keys(h.counts).length} items counted
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(['OK', 'LOW', 'CRITICAL', 'OUT'] as StockStatus[]).map((s) => (
          <div
            key={s}
            style={{
              background: statusBg(s),
              border: `1px solid ${statusColor(s)}44`,
              borderRadius: 8,
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 60,
              flex: 1,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 800, color: statusColor(s) }}>{statusCounts[s]}</span>
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontFamily: 'inherit',
              fontSize: 13,
              padding: '8px 12px',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <Btn small variant="ghost" onClick={() => setShowHistory(true)}>
          History
        </Btn>
      </div>

      {/* WhatsApp alert button */}
      {criticalItems.length > 0 && settings.managerPhone && (
        <a
          href={buildWaLink(settings.managerPhone, waMessage)}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#25D366',
            color: '#fff',
            padding: '10px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          📱 Alert Manager via WhatsApp ({criticalItems.length} critical items)
        </a>
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {(['All', ...CATEGORIES] as (StockCategory | 'All')[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              background: category === cat ? C.amber : C.card,
              color: category === cat ? '#000' : C.muted,
              border: `1px solid ${category === cat ? C.amber : C.border}`,
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((item) => {
          const count = counts[item.id] ?? 0
          const status = getStatus(count, item.parLevel)
          const pct = item.parLevel === 0 ? 0 : Math.min(100, (count / item.parLevel) * 100)
          return (
            <Card key={item.id} style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1, marginRight: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{item.category} · PAR: {item.parLevel} {item.unit}</div>
                </div>
                <Badge label={status} color={statusColor(status)} bg={statusBg(status)} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <ProgressBar value={count} max={item.parLevel} color={statusColor(status)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setCount(item.id, count - 1)}
                  style={{
                    width: 32,
                    height: 32,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                >
                  −
                </button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    value={count}
                    onChange={(e) => setCount(item.id, Number(e.target.value))}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      color: C.text,
                      fontFamily: 'inherit',
                      fontSize: 16,
                      fontWeight: 800,
                      padding: '4px 8px',
                      textAlign: 'center',
                      outline: 'none',
                      width: '70px',
                    }}
                  />
                  <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>{item.unit}</span>
                </div>
                <button
                  onClick={() => setCount(item.id, count + 1)}
                  style={{
                    width: 32,
                    height: 32,
                    background: C.amber,
                    border: 'none',
                    borderRadius: 8,
                    color: '#000',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'inherit',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  +
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Submit button */}
      <div style={{ paddingBottom: 8 }}>
        <Btn full onClick={() => setConfirmSheet(true)} disabled={countedItems.length === 0}>
          Submit Stock Count ({countedItems.length} items)
        </Btn>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: C.green,
            color: '#000',
            padding: '10px 18px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13,
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      )}

      <Sheet open={confirmSheet} onClose={() => setConfirmSheet(false)} title="Submit Stock Count">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 14, color: C.muted }}>
            You are submitting stock count for <strong style={{ color: C.text }}>{viewOutlet}</strong> on{' '}
            <strong style={{ color: C.text }}>{fmtDate(today)}</strong>.
          </div>
          <div
            style={{
              background: C.card,
              borderRadius: 8,
              padding: 12,
              fontSize: 13,
              color: C.muted,
            }}
          >
            <div style={{ marginBottom: 6, fontWeight: 700, color: C.text }}>Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>✅ OK: {statusCounts.OK} items</div>
              <div style={{ color: C.amber }}>⚠️ LOW: {statusCounts.LOW} items</div>
              <div style={{ color: C.orange }}>🔴 CRITICAL: {statusCounts.CRITICAL} items</div>
              <div style={{ color: C.red }}>❌ OUT: {statusCounts.OUT} items</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setConfirmSheet(false)}>
              Cancel
            </Btn>
            <Btn full onClick={handleSubmit}>
              Confirm Submit
            </Btn>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
