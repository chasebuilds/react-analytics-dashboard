export type Category = 'Hardware' | 'Garden' | 'Kitchen' | 'Lighting' | 'Tools'
export type Channel = 'Online' | 'Storefront' | 'Wholesale'
export type Status = 'Paid' | 'Shipped' | 'Refunded' | 'Pending'

export interface Order {
  id: string
  date: string // YYYY-MM-DD
  customer: string
  product: string
  category: Category
  channel: Channel
  status: Status
  units: number
  revenue: number
}

export interface Filters {
  from: string
  to: string
  category: Category | 'All'
  channel: Channel | 'All'
  status: Status | 'All'
  search: string
}

export interface Kpis {
  revenue: number
  orders: number
  avgOrder: number
  units: number
  refundRate: number
}

export interface Point {
  label: string
  value: number
}
