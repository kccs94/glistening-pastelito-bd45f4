import React, { useState } from 'react'
import type { Outlet, SalesEntry, Expense, AppSettings } from './shared'
import {
  C,
  STORAGE_KEYS,
  store,
  fmtMyr,
  fmtDate,
  todayStr,
  genId,
  DEFAULT_SETTINGS,
} from './shared'
import { Badge, Btn, Card, Input, SectionHeader, Sheet, Divider } from './ui'

interface Props {
  user: { role: 'manager' | 'staff'; name: string; outlet: Outlet }
  viewOutlet: Outlet
}

const EMPTY_FORM = {
  date: todayStr(),
  cash: '',
  card: '',
  duitnow: '',
  onePay: '',
  notes: '',
}

export function SalesTab({ user, viewOutlet }: Props) {
  const settings: AppSettings = store.get('bz_settings', DEFAULT_SETTINGS)

  const [entries, setEntries] = useState<SalesEntry[]>(() =>
    store.get(STORAGE_KEYS.salesEntries(viewOutlet), []),
  )
  const [form, setForm] = useState(EMPTY_FORM)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expDesc, setExpDesc] = useState('')
  const [expAmt, setExpAmt] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [approveSheet, setApproveSheet] = useState<SalesEntry | null>(null)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const saveEntries = (updated: SalesEntry[]) => {
    setEntries(updated)
    store.set(STORAGE_KEYS.salesEntries(viewOutlet), updated)
  }

  const total =
    (Number(form.cash) || 0) +
    (Number(form.card) || 0) +
    (Number(form.duitnow) || 0) +
    (Number(form.onePay) || 0)

  const totalExpenses = expenses.reduce((s, e) => s + e.amt, 0)
  const target = settings.dailyTarget ?? 3000
  const variance = total - target

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3000)
  }

  const handleAddExpense = () => {
    if (!expDesc || !expAmt) return
    setExpenses((prev) => [...prev, { desc: expDesc, amt: Number(expAmt) }])
    setExpDesc('')
    setExpAmt('')
  }

  const handleSubmit = () => {
    if (total === 0) {
      showToast('Please enter at least one payment amount', 'error')
      return
    }
    const entry: SalesEntry = {
      id: genId(),
      date: form.date,
      outlet: viewOutlet,
      cash: Number(form.cash) || 0,
      card: Number(form.card) || 0,
      duitnow: Number(form.duitnow) || 0,
      onePay: Number(form.onePay) || 0,
      expenses,
      notes: form.notes,
      submittedBy: user.name,
      submittedAt: new Date().toISOString(),
      approved: user.role === 'manager',
      approvedBy: user.role === 'manager' ? user.name : undefined,
    }
    saveEntries([entry, ...entries])
    setForm(EMPTY_FORM)
    setExpenses([])
    showToast(user.role === 'manager' ? 'Sales entry saved!' : 'Submitted for approval!')
  }

  const handleApprove = (entry: SalesEntry, approved: boolean) => {
    const updated = entries.map((e) =>
      e.id === entry.id
        ? { ...e, approved, approvedBy: approved ? user.name : undefined }
        : e,
    )
    saveEntries(updated)
    setApproveSheet(null)
    showToast(approved ? 'Sales entry approved!' : 'Sales entry rejected')
  }

  const pendingEntries = entries.filter((e) => !e.approved)
  const approvedEntries = entries.filter((e) => e.approved)

  if (showHistory) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Btn small variant="ghost" onClick={() => setShowHistory(false)}>
            ← Back
          </Btn>
          <span style={{ fontWeight: 800, fontSize: 14, color: C.text }}>Sales History</span>
        </div>

        {/* Pending section for manager */}
        {user.role === 'manager' && pendingEntries.length > 0 && (
          <div>
            <SectionHeader title="Pending Approval" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingEntries.map((e) => (
                <Card key={e.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>
                        {fmtMyr(e.cash + e.card + e.duitnow + e.onePay)}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {e.submittedBy} · {fmtDate(e.date)}
                      </div>
                    </div>
                    <Badge label="PENDING" color={C.amber} bg={C.amberDim} />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <Btn small variant="success" onClick={() => setApproveSheet(e)}>
                      Review
                    </Btn>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <SectionHeader title="Approved Sales" />
        {approvedEntries.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '20px 0' }}>
              No approved entries yet
            </div>
          </Card>
        )}
        {approvedEntries.map((e) => {
          const gross = e.cash + e.card + e.duitnow + e.onePay
          const totalExp = e.expenses.reduce((s, x) => s + x.amt, 0)
          return (
            <Card key={e.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>{fmtMyr(gross)}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {e.submittedBy} · {fmtDate(e.date)}
                  </div>
                </div>
                <Badge label="APPROVED" color={C.green} bg={C.greenDim} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: C.muted }}>
                {e.cash > 0 && <span>Cash: {fmtMyr(e.cash)}</span>}
                {e.card > 0 && <span>Card: {fmtMyr(e.card)}</span>}
                {e.duitnow > 0 && <span>DuitNow: {fmtMyr(e.duitnow)}</span>}
                {e.onePay > 0 && <span>1Pay: {fmtMyr(e.onePay)}</span>}
              </div>
              {totalExp > 0 && (
                <div style={{ fontSize: 11, color: C.orange, marginTop: 4 }}>
                  Expenses: {fmtMyr(totalExp)}
                </div>
              )}
              {e.approvedBy && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  Approved by {e.approvedBy}
                </div>
              )}
            </Card>
          )
        })}

        {/* Approve Sheet */}
        <Sheet
          open={!!approveSheet}
          onClose={() => setApproveSheet(null)}
          title="Review Sales Entry"
        >
          {approveSheet && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: C.card, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>CASH</div>
                  <div style={{ fontWeight: 700, color: C.text }}>{fmtMyr(approveSheet.cash)}</div>
                </div>
                <div style={{ background: C.card, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>CARD</div>
                  <div style={{ fontWeight: 700, color: C.text }}>{fmtMyr(approveSheet.card)}</div>
                </div>
                <div style={{ background: C.card, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>DUITNOW</div>
                  <div style={{ fontWeight: 700, color: C.text }}>{fmtMyr(approveSheet.duitnow)}</div>
                </div>
                <div style={{ background: C.card, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>1PAY</div>
                  <div style={{ fontWeight: 700, color: C.text }}>{fmtMyr(approveSheet.onePay)}</div>
                </div>
              </div>
              <div style={{ background: C.card, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>TOTAL GROSS</div>
                <div style={{ fontWeight: 800, fontSize: 20, color: C.amber }}>
                  {fmtMyr(approveSheet.cash + approveSheet.card + approveSheet.duitnow + approveSheet.onePay)}
                </div>
              </div>
              {approveSheet.expenses.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>EXPENSES</div>
                  {approveSheet.expenses.map((exp, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: C.text }}>
                      <span>{exp.desc}</span>
                      <span style={{ color: C.orange }}>{fmtMyr(exp.amt)}</span>
                    </div>
                  ))}
                </div>
              )}
              {approveSheet.notes && (
                <div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>NOTES</div>
                  <div style={{ fontSize: 13, color: C.text }}>{approveSheet.notes}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="danger" full onClick={() => handleApprove(approveSheet, false)}>
                  Reject
                </Btn>
                <Btn variant="success" full onClick={() => handleApprove(approveSheet, true)}>
                  Approve
                </Btn>
              </div>
            </div>
          )}
        </Sheet>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: C.text }}>New Sales Entry</span>
        <Btn small variant="ghost" onClick={() => setShowHistory(true)}>
          History {entries.length > 0 ? `(${entries.length})` : ''}
        </Btn>
      </div>

      {/* Date */}
      <Input
        label="Date"
        type="date"
        value={form.date}
        onChange={(v) => setForm({ ...form, date: v })}
      />

      {/* Payment breakdown */}
      <Card>
        <SectionHeader title="Payment Breakdown" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input
            label="Cash (RM)"
            type="number"
            value={form.cash}
            onChange={(v) => setForm({ ...form, cash: v })}
            placeholder="0.00"
            min={0}
            step={0.01}
          />
          <Input
            label="Card (RM)"
            type="number"
            value={form.card}
            onChange={(v) => setForm({ ...form, card: v })}
            placeholder="0.00"
            min={0}
            step={0.01}
          />
          <Input
            label="DuitNow (RM)"
            type="number"
            value={form.duitnow}
            onChange={(v) => setForm({ ...form, duitnow: v })}
            placeholder="0.00"
            min={0}
            step={0.01}
          />
          <Input
            label="1Pay (RM)"
            type="number"
            value={form.onePay}
            onChange={(v) => setForm({ ...form, onePay: v })}
            placeholder="0.00"
            min={0}
            step={0.01}
          />
        </div>
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: C.muted }}>TOTAL</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: C.amber }}>{fmtMyr(total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: C.muted }}>vs Target ({fmtMyr(target)})</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: variance >= 0 ? C.green : C.red,
            }}
          >
            {variance >= 0 ? '+' : ''}{fmtMyr(variance)}
          </span>
        </div>
      </Card>

      {/* Expenses */}
      <Card>
        <SectionHeader title="Expenses" />
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 2 }}>
            <input
              type="text"
              placeholder="Description"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              style={{
                background: C.surface,
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
          <div style={{ flex: 1 }}>
            <input
              type="number"
              placeholder="Amount"
              value={expAmt}
              min={0}
              onChange={(e) => setExpAmt(e.target.value)}
              style={{
                background: C.surface,
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
          <Btn small onClick={handleAddExpense}>
            +
          </Btn>
        </div>
        {expenses.length === 0 && (
          <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '8px 0' }}>
            No expenses added
          </div>
        )}
        {expenses.map((exp, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <span style={{ fontSize: 13, color: C.text }}>{exp.desc}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: C.orange }}>{fmtMyr(exp.amt)}</span>
              <button
                onClick={() => setExpenses((prev) => prev.filter((_, idx) => idx !== i))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.red,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontFamily: 'inherit',
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {expenses.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Total Expenses</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>
              {fmtMyr(totalExpenses)}
            </span>
          </div>
        )}
      </Card>

      {/* Notes */}
      <div>
        <label
          style={{
            fontSize: 11,
            color: C.muted,
            fontWeight: 600,
            letterSpacing: '0.06em',
            display: 'block',
            marginBottom: 4,
          }}
        >
          NOTES
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional notes..."
          rows={3}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.text,
            fontFamily: 'inherit',
            fontSize: 13,
            padding: '10px 12px',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
            resize: 'vertical',
          }}
        />
      </div>

      <Btn full onClick={handleSubmit} disabled={total === 0}>
        {user.role === 'manager' ? 'Save Sales Entry' : 'Submit for Approval'}
      </Btn>

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
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
