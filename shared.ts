// ─── Types ───────────────────────────────────────────────────────────────────

export type Role = 'manager' | 'staff'
export type Outlet = '1 Utama' | 'Melawati Mall'
export type StockCategory =
  | 'Frozen'
  | 'Raw Materials'
  | 'Spread & Creams'
  | 'Beverage'
  | 'Packaging'
export type StockStatus = 'OK' | 'LOW' | 'CRITICAL' | 'OUT'
export type ShiftType = 'Opening' | 'Closing' | 'Full Day' | 'Off Day'
export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'MC'
  | 'Late'
  | 'Half Day'
  | 'OT'
export type Tab =
  | 'dashboard'
  | 'stock'
  | 'sales'
  | 'schedule'
  | 'performance'
  | 'settings'

export interface User {
  role: Role
  name: string
  outlet: Outlet
}

export interface StockItem {
  id: string
  name: string
  category: StockCategory
  unit: string
  parLevel: number
}

export interface StockCount {
  [itemId: string]: number
}

export interface StockSubmission {
  id: string
  date: string
  outlet: Outlet
  counts: StockCount
  submittedBy: string
  submittedAt: string
}

export interface Expense {
  desc: string
  amt: number
}

export interface SalesEntry {
  id: string
  date: string
  outlet: Outlet
  cash: number
  card: number
  duitnow: number
  onePay: number
  expenses: Expense[]
  notes: string
  submittedBy: string
  submittedAt: string
  approved: boolean
  approvedBy?: string
  // New fields
  doughMade?: number
  totalBill?: number
  totalLeftover?: number
}

export interface ScheduleEntry {
  weekStart: string
  outlet: Outlet
  shifts: { [staff: string]: { [day: string]: ShiftType } }
}

export interface AttendanceEntry {
  date: string
  outlet: Outlet
  staff: string
  status: AttendanceStatus
  otHours: number
}

export interface OutletTargets {
  monthlyTarget: number
  forecastWeekday: number
  forecastWeekend: number
}

export interface AppSettings {
  sheetsApiKey: string
  spreadsheetId: string
  managerPhone: string
  waGroupPhone: string          // NEW: designated WhatsApp group/number
  dailyTarget: number
  staffList: Record<Outlet, string[]>        // NEW: dynamic staff per outlet
  outletTargets: Record<Outlet, OutletTargets> // NEW: per-outlet targets & forecast
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const OUTLETS: Outlet[] = ['1 Utama', 'Melawati Mall']

// Kept as fallback / seed — runtime always reads from settings.staffList
export const STAFF: Record<Outlet, string[]> = {
  '1 Utama': ['Ahmad Razif', 'Nurul Ain'],
  'Melawati Mall': ['Hafiz Zulkifli', 'Siti Rahmah'],
}

export const ALL_STAFF = [
  ...STAFF['1 Utama'],
  ...STAFF['Melawati Mall'],
]

export const MANAGER_PASSWORD = '888888'

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const SHIFT_TYPES: ShiftType[] = [
  'Opening',
  'Closing',
  'Full Day',
  'Off Day',
]

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'Present',
  'Absent',
  'MC',
  'Late',
  'Half Day',
  'OT',
]

export const CATEGORIES: StockCategory[] = [
  'Frozen',
  'Raw Materials',
  'Spread & Creams',
  'Beverage',
  'Packaging',
]

export const STOCK_ITEMS: StockItem[] = [
  // Frozen (8)
  { id: 'F01', name: 'Jumbo Chich Sausage', category: 'Frozen', unit: 'PKT', parLevel: 20 },
  { id: 'F02', name: 'Ayamadu Chicken Sandwich', category: 'Frozen', unit: 'PKT', parLevel: 15 },
  { id: 'F03', name: 'Anchor Shredded Cheddar', category: 'Frozen', unit: 'PKT', parLevel: 10 },
  { id: 'F04', name: 'Anchor Slice Cheese', category: 'Frozen', unit: 'PKT', parLevel: 10 },
  { id: 'F05', name: 'Anchor Cheddar Block', category: 'Frozen', unit: 'PKT', parLevel: 8 },
  { id: 'F06', name: 'Perfect Grated Parmesan', category: 'Frozen', unit: 'PKT', parLevel: 6 },
  { id: 'F07', name: 'Chicken Pepperoni Sliced', category: 'Frozen', unit: 'PKT', parLevel: 10 },
  { id: 'F08', name: 'Mayo', category: 'Frozen', unit: 'PKT', parLevel: 5 },
  // Raw Materials (11)
  { id: 'A01', name: 'Pretzel Premix', category: 'Raw Materials', unit: 'PKT', parLevel: 24 },
  { id: 'A02', name: 'Caramel Almond', category: 'Raw Materials', unit: 'PKT', parLevel: 12 },
  { id: 'A03', name: 'Cinnamon Sugar', category: 'Raw Materials', unit: 'PKT', parLevel: 12 },
  { id: 'A04', name: 'Seaweed Powders', category: 'Raw Materials', unit: 'PKT', parLevel: 10 },
  { id: 'A05', name: 'Crush Peanut', category: 'Raw Materials', unit: 'PKT', parLevel: 8 },
  { id: 'A06', name: 'Sesame Seeds', category: 'Raw Materials', unit: 'PKT', parLevel: 8 },
  { id: 'A07', name: 'SAF Instant Yeast Gold', category: 'Raw Materials', unit: 'PKT', parLevel: 10 },
  { id: 'A08', name: 'Dark Compound Choc Block', category: 'Raw Materials', unit: 'BLK', parLevel: 10 },
  { id: 'A09', name: 'Hazelnut Paste Intense', category: 'Raw Materials', unit: 'PKT', parLevel: 3 },
  { id: 'A10', name: 'Namcho Vege Margarine', category: 'Raw Materials', unit: 'PKT', parLevel: 2 },
  { id: 'A11', name: 'QBB Ghee', category: 'Raw Materials', unit: 'PKT', parLevel: 2 },
  // Spread & Creams (12)
  { id: 'S01', name: 'Spread Cheese', category: 'Spread & Creams', unit: 'PAIL', parLevel: 4 },
  { id: 'S02', name: 'Spread Chocolate', category: 'Spread & Creams', unit: 'PAIL', parLevel: 4 },
  { id: 'S03', name: 'Spread Coffee', category: 'Spread & Creams', unit: 'PAIL', parLevel: 3 },
  { id: 'S04', name: 'Spread Matcha', category: 'Spread & Creams', unit: 'PAIL', parLevel: 3 },
  { id: 'S05', name: 'Spread Mango', category: 'Spread & Creams', unit: 'PAIL', parLevel: 3 },
  { id: 'S06', name: 'Pistachio Glaze Choc', category: 'Spread & Creams', unit: 'TUB', parLevel: 6 },
  { id: 'S07', name: 'Strawberry Glaze Choc', category: 'Spread & Creams', unit: 'TUB', parLevel: 6 },
  { id: 'S08', name: 'Caramel Glaze Choc', category: 'Spread & Creams', unit: 'TUB', parLevel: 6 },
  { id: 'S09', name: 'Tiramisu Glaze Choc', category: 'Spread & Creams', unit: 'TUB', parLevel: 4 },
  { id: 'S10', name: 'Green Chopped Pistachio', category: 'Spread & Creams', unit: 'PKT', parLevel: 4 },
  { id: 'S11', name: 'Strawberry Choco Rice Ball', category: 'Spread & Creams', unit: 'PKT', parLevel: 4 },
  { id: 'S12', name: 'Butter Crunchy Pieces', category: 'Spread & Creams', unit: 'PKT', parLevel: 4 },
  // Beverage (3)
  { id: 'B01', name: 'Instant White Coffee', category: 'Beverage', unit: 'PKT', parLevel: 8 },
  { id: 'B02', name: 'Green Tea Powder', category: 'Beverage', unit: 'PKT', parLevel: 6 },
  { id: 'B03', name: 'Mineral Water', category: 'Beverage', unit: 'BTL', parLevel: 24 },
  // Packaging (12)
  { id: 'P01', name: 'Greaseproof Paper Bag', category: 'Packaging', unit: 'PCS', parLevel: 2000 },
  { id: 'P02', name: 'Brown Satchel Bag', category: 'Packaging', unit: 'PCS', parLevel: 1000 },
  { id: 'P03', name: 'Paper Carry Bag', category: 'Packaging', unit: 'PCS', parLevel: 500 },
  { id: 'P04', name: 'Foldable Cup', category: 'Packaging', unit: 'PCS', parLevel: 200 },
  { id: 'P05', name: 'Sauce Container', category: 'Packaging', unit: 'PCS', parLevel: 300 },
  { id: 'P06', name: '16OZ Cup', category: 'Packaging', unit: 'PCS', parLevel: 500 },
  { id: 'P07', name: '16OZ Cup Lid', category: 'Packaging', unit: 'PCS', parLevel: 500 },
  { id: 'P08', name: 'Solution Water', category: 'Packaging', unit: 'BTL', parLevel: 10 },
  { id: 'P09', name: 'Non Sticky Spray', category: 'Packaging', unit: 'TIN', parLevel: 6 },
  { id: 'P10', name: 'Straw', category: 'Packaging', unit: 'PCS', parLevel: 200 },
  { id: 'P11', name: 'Receipt Rolls', category: 'Packaging', unit: 'ROLL', parLevel: 10 },
  { id: 'P12', name: 'GHL Paper Roll', category: 'Packaging', unit: 'ROLL', parLevel: 5 },
]

// ─── Colors ───────────────────────────────────────────────────────────────────

export const C = {
  bg: '#080808',
  surface: '#111111',
  card: '#161616',
  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.15)',
  text: '#FAFAFA',
  muted: '#888888',
  border: '#222222',
  green: '#22C55E',
  greenDim: 'rgba(34,197,94,0.15)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.15)',
  orange: '#F97316',
  orangeDim: 'rgba(249,115,22,0.15)',
  blue: '#3B82F6',
  blueDim: 'rgba(59,130,246,0.15)',
} as const

// ─── Storage ──────────────────────────────────────────────────────────────────

export const store = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set: (key: string, val: unknown) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(val))
    } catch {}
  },
  remove: (key: string) => {
    try {
      window.localStorage.removeItem(key)
    } catch {}
  },
}

export const STORAGE_KEYS = {
  user: 'bz_user',
  settings: 'bz_settings',
  stockCounts: (outlet: Outlet, date: string) =>
    `bz_stock_${outlet}_${date}`,
  stockHistory: (outlet: Outlet) => `bz_stock_hist_${outlet}`,
  salesEntries: (outlet: Outlet) => `bz_sales_${outlet}`,
  schedule: (outlet: Outlet, weekStart: string) =>
    `bz_sched_${outlet}_${weekStart}`,
  attendance: (outlet: Outlet) => `bz_att_${outlet}`,
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export const todayStr = () => new Date().toISOString().split('T')[0]

export const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export const fmtMyr = (n: number) =>
  'RM ' +
  n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const getStatus = (count: number, par: number): StockStatus => {
  if (count === 0) return 'OUT'
  const pct = count / par
  if (pct <= 0.25) return 'CRITICAL'
  if (pct <= 0.5) return 'LOW'
  return 'OK'
}

export const statusColor = (s: StockStatus) =>
  ({ OK: C.green, LOW: C.amber, CRITICAL: C.orange, OUT: C.red }[s])

export const statusBg = (s: StockStatus) =>
  ({ OK: C.greenDim, LOW: C.amberDim, CRITICAL: C.orangeDim, OUT: C.redDim }[s])

export const getMondayOfWeek = (date: Date): string => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export const getWeekDates = (weekStart: string): string[] => {
  const start = new Date(weekStart + 'T00:00:00')
  return DAYS.map((_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export const getLast7Days = (): string[] => {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export const getLastNDays = (n: number): string[] => {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export const outletForStaff = (name: string): Outlet | null => {
  // Check dynamic settings first, then fall back to static STAFF
  try {
    const settings: AppSettings = store.get('bz_settings', DEFAULT_SETTINGS)
    for (const [outlet, staffArr] of Object.entries(settings.staffList)) {
      if ((staffArr as string[]).includes(name)) return outlet as Outlet
    }
  } catch {}
  for (const [outlet, staff] of Object.entries(STAFF)) {
    if (staff.includes(name)) return outlet as Outlet
  }
  return null
}

export const getAllStaffFromSettings = (): string[] => {
  try {
    const settings: AppSettings = store.get('bz_settings', DEFAULT_SETTINGS)
    return OUTLETS.flatMap((o) => settings.staffList[o] || [])
  } catch {
    return ALL_STAFF
  }
}

export const buildWaLink = (phone: string, message: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`

export const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ─── Default Settings ─────────────────────────────────────────────────────────

export const DEFAULT_OUTLET_TARGETS: OutletTargets = {
  monthlyTarget: 80000,
  forecastWeekday: 1500,
  forecastWeekend: 3000,
}

export const DEFAULT_SETTINGS: AppSettings = {
  sheetsApiKey: '',
  spreadsheetId: '',
  managerPhone: '',
  waGroupPhone: '',
  dailyTarget: 3000,
  staffList: {
    '1 Utama': [...STAFF['1 Utama']],
    'Melawati Mall': [...STAFF['Melawati Mall']],
  },
  outletTargets: {
    '1 Utama': { ...DEFAULT_OUTLET_TARGETS },
    'Melawati Mall': { ...DEFAULT_OUTLET_TARGETS },
  },
}
