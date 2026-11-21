import { describe, expect, it } from 'vitest'
import { generateOrders } from './data'
import {
  computeKpis, filterOrders, revenueSeries, sortOrders, sumBy, toCsv, topProducts, weekStart,
} from './transforms'
import type { Filters, Order } from './types'

const base: Filters = { from: '', to: '', category: 'All', channel: 'All', status: 'All', search: '' }
const o = (p: Partial<Order>): Order => ({
  id: 'A1', date: '2026-01-05', customer: 'Ada Ames', product: 'Pendant Lamp', category: 'Lighting',
  channel: 'Online', status: 'Paid', units: 1, revenue: 100, ...p,
})

describe('generateOrders', () => {
  it('is deterministic for a seed', () => {
    expect(generateOrders(7)).toEqual(generateOrders(7))
    expect(generateOrders(7)).not.toEqual(generateOrders(8))
  })
  it('has unique ids and positive revenue', () => {
    const d = generateOrders()
    expect(new Set(d.map((x) => x.id)).size).toBe(d.length)
    expect(d.every((x) => x.revenue > 0 && x.units > 0)).toBe(true)
  })
})

describe('filterOrders', () => {
  const data = [
    o({ id: 'A1', date: '2026-01-01' }),
    o({ id: 'A2', date: '2026-01-10', category: 'Tools', product: 'Cordless Drill' }),
    o({ id: 'A3', date: '2026-01-20', channel: 'Wholesale', status: 'Refunded', customer: 'Ben Cole' }),
  ]
  it('filters by inclusive date range', () => {
    expect(filterOrders(data, { ...base, from: '2026-01-10', to: '2026-01-20' }).map((x) => x.id)).toEqual(['A2', 'A3'])
  })
  it('filters by category, channel and status', () => {
    expect(filterOrders(data, { ...base, category: 'Tools' })).toHaveLength(1)
    expect(filterOrders(data, { ...base, channel: 'Wholesale' })).toHaveLength(1)
    expect(filterOrders(data, { ...base, status: 'Paid' })).toHaveLength(2)
  })
  it('searches id, customer and product case-insensitively', () => {
    expect(filterOrders(data, { ...base, search: 'ben' }).map((x) => x.id)).toEqual(['A3'])
    expect(filterOrders(data, { ...base, search: 'DRILL' }).map((x) => x.id)).toEqual(['A2'])
  })
})

describe('computeKpis', () => {
  it('excludes refunds from revenue and computes rates', () => {
    const k = computeKpis([o({ revenue: 100, units: 2 }), o({ revenue: 50, units: 1 }), o({ status: 'Refunded', revenue: 999 })])
    expect(k.revenue).toBe(150)
    expect(k.orders).toBe(3)
    expect(k.avgOrder).toBe(75)
    expect(k.units).toBe(3)
    expect(k.refundRate).toBeCloseTo(1 / 3)
  })
  it('handles empty input', () => {
    expect(computeKpis([])).toEqual({ revenue: 0, orders: 0, avgOrder: 0, units: 0, refundRate: 0 })
  })
})

describe('series', () => {
  it('weekStart returns Monday', () => {
    expect(weekStart('2026-11-21')).toBe('2026-11-16') // Saturday
    expect(weekStart('2026-11-16')).toBe('2026-11-16')
    expect(weekStart('2026-11-22')).toBe('2026-11-16') // Sunday
  })
  it('uses daily points for short ranges, weekly for long', () => {
    const short = [o({ date: '2026-01-01' }), o({ date: '2026-01-01', revenue: 20 }), o({ date: '2026-01-03' })]
    expect(revenueSeries(short)).toEqual([{ label: '2026-01-01', value: 120 }, { label: '2026-01-03', value: 100 }])
    const long = [o({ date: '2026-01-01' }), o({ date: '2026-04-01' })]
    expect(revenueSeries(long).map((p) => p.label)).toEqual(['2025-12-29', '2026-03-30'])
  })
  it('sums by key and ranks top products', () => {
    const d = [o({ product: 'A', revenue: 10 }), o({ product: 'B', revenue: 30 }), o({ product: 'A', revenue: 25 })]
    expect(sumBy(d, (x) => x.product)).toEqual([{ label: 'A', value: 35 }, { label: 'B', value: 30 }])
    expect(topProducts(d, 1)).toEqual([{ label: 'A', value: 35 }])
  })
})

describe('sortOrders', () => {
  it('sorts numbers numerically and does not mutate', () => {
    const d = [o({ id: 'a', revenue: 9 }), o({ id: 'b', revenue: 100 }), o({ id: 'c', revenue: 20 })]
    expect(sortOrders(d, 'revenue', 'desc').map((x) => x.id)).toEqual(['b', 'c', 'a'])
    expect(sortOrders(d, 'revenue', 'asc').map((x) => x.id)).toEqual(['a', 'c', 'b'])
    expect(d.map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('toCsv', () => {
  it('writes header and rows with CRLF', () => {
    const lines = toCsv([o({})]).split('\r\n')
    expect(lines[0]).toBe('id,date,customer,product,category,channel,status,units,revenue')
    expect(lines[1]).toBe('A1,2026-01-05,Ada Ames,Pendant Lamp,Lighting,Online,Paid,1,100')
  })
  it('quotes commas and quotes, and neutralises formulas', () => {
    const csv = toCsv([o({ customer: 'Cole, "Ben"' }), o({ customer: '=SUM(A1)' })])
    expect(csv).toContain('"Cole, ""Ben"""')
    expect(csv).toContain("'=SUM(A1)")
  })
})
