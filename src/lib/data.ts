import type { Category, Channel, Order, Status } from './types'

// Small seeded PRNG so every visitor sees the same synthetic data.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PRODUCTS: { name: string; category: Category; price: number }[] = [
  { name: 'Brass Cabinet Pull', category: 'Hardware', price: 6.5 },
  { name: 'Steel Hinge Set', category: 'Hardware', price: 18 },
  { name: 'Raised Garden Bed', category: 'Garden', price: 74 },
  { name: 'Pruning Shears', category: 'Garden', price: 24 },
  { name: 'Cast Iron Skillet', category: 'Kitchen', price: 39 },
  { name: 'Walnut Cutting Board', category: 'Kitchen', price: 52 },
  { name: 'Pendant Lamp', category: 'Lighting', price: 88 },
  { name: 'LED Strip Kit', category: 'Lighting', price: 29 },
  { name: 'Cordless Drill', category: 'Tools', price: 119 },
  { name: 'Socket Wrench Set', category: 'Tools', price: 46 },
]

const FIRST = ['Ada', 'Ben', 'Cleo', 'Dan', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivo', 'Jo', 'Kit', 'Lena']
const LAST = ['Ames', 'Birch', 'Cole', 'Dunn', 'Ellis', 'Frost', 'Grant', 'Hale', 'Ives', 'Jarvis']
const CHANNELS: Channel[] = ['Online', 'Online', 'Online', 'Storefront', 'Storefront', 'Wholesale']
const STATUSES: Status[] = ['Paid', 'Paid', 'Paid', 'Paid', 'Shipped', 'Shipped', 'Shipped', 'Refunded', 'Pending']

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const DATA_END = '2026-10-31'
export const DATA_DAYS = 180

export function generateOrders(seed = 42, end = DATA_END, days = DATA_DAYS): Order[] {
  const rnd = mulberry32(seed)
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)] as T
  const orders: Order[] = []
  let n = 1000
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(end, -i)
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
    const weekend = dow === 0 || dow === 6
    const growth = 1 + ((days - i) / days) * 0.35
    const count = Math.round((weekend ? 5 : 8) * growth * (0.7 + rnd() * 0.6))
    for (let k = 0; k < count; k++) {
      const p = pick(PRODUCTS)
      const channel = pick(CHANNELS)
      const units = channel === 'Wholesale' ? 5 + Math.floor(rnd() * 20) : 1 + Math.floor(rnd() * 3)
      const discount = channel === 'Wholesale' ? 0.8 : 1
      orders.push({
        id: `JS-${n++}`,
        date,
        customer: `${pick(FIRST)} ${pick(LAST)}`,
        product: p.name,
        category: p.category,
        channel,
        status: pick(STATUSES),
        units,
        revenue: Math.round(p.price * units * discount * 100) / 100,
      })
    }
  }
  return orders
}

export const CATEGORIES: Category[] = ['Hardware', 'Garden', 'Kitchen', 'Lighting', 'Tools']
export const CHANNEL_LIST: Channel[] = ['Online', 'Storefront', 'Wholesale']
export const STATUS_LIST: Status[] = ['Paid', 'Shipped', 'Refunded', 'Pending']
