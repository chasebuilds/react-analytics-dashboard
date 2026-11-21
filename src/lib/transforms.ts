import type { Filters, Kpis, Order, Point } from './types'

export function filterOrders(orders: Order[], f: Filters): Order[] {
  const q = f.search.trim().toLowerCase()
  return orders.filter(
    (o) =>
      (!f.from || o.date >= f.from) &&
      (!f.to || o.date <= f.to) &&
      (f.category === 'All' || o.category === f.category) &&
      (f.channel === 'All' || o.channel === f.channel) &&
      (f.status === 'All' || o.status === f.status) &&
      (!q || `${o.id} ${o.customer} ${o.product}`.toLowerCase().includes(q)),
  )
}

// Refunded orders do not count toward revenue.
export function computeKpis(orders: Order[]): Kpis {
  const kept = orders.filter((o) => o.status !== 'Refunded')
  const revenue = kept.reduce((s, o) => s + o.revenue, 0)
  return {
    revenue,
    orders: orders.length,
    avgOrder: kept.length ? revenue / kept.length : 0,
    units: kept.reduce((s, o) => s + o.units, 0),
    refundRate: orders.length ? (orders.length - kept.length) / orders.length : 0,
  }
}

const round = (n: number) => Math.round(n * 100) / 100

export function sumBy(orders: Order[], key: (o: Order) => string): Point[] {
  const m = new Map<string, number>()
  for (const o of orders) {
    if (o.status === 'Refunded') continue
    const k = key(o)
    m.set(k, (m.get(k) ?? 0) + o.revenue)
  }
  return [...m].map(([label, v]) => ({ label, value: round(v) }))
}

// Monday of the week containing the ISO date.
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const shift = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - shift)
  return d.toISOString().slice(0, 10)
}

export function revenueSeries(orders: Order[]): Point[] {
  if (!orders.length) return []
  const dates = orders.map((o) => o.date).sort()
  const first = dates[0] as string
  const last = dates[dates.length - 1] as string
  const weekly = (Date.parse(last) - Date.parse(first)) / 864e5 > 60
  return sumBy(orders, (o) => (weekly ? weekStart(o.date) : o.date)).sort((a, b) => a.label.localeCompare(b.label))
}

export function topProducts(orders: Order[], n = 5): Point[] {
  return sumBy(orders, (o) => o.product)
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
}

export type SortKey = 'date' | 'id' | 'customer' | 'product' | 'channel' | 'status' | 'units' | 'revenue'

export function sortOrders(orders: Order[], key: SortKey, dir: 'asc' | 'desc'): Order[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...orders].sort((a, b) => {
    const x = a[key]
    const y = b[key]
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
    return c * sign || a.id.localeCompare(b.id)
  })
}

function csvCell(v: string | number): string {
  let s = String(v)
  // Stop spreadsheet apps from running cell text as a formula.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(orders: Order[]): string {
  const head = ['id', 'date', 'customer', 'product', 'category', 'channel', 'status', 'units', 'revenue'] as const
  const rows = orders.map((o) => head.map((h) => csvCell(o[h])).join(','))
  return [head.join(','), ...rows].join('\r\n') + '\r\n'
}

export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
export const money2 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
