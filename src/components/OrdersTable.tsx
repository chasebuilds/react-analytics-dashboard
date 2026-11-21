import { useMemo, useState } from 'react'
import { money2, sortOrders, type SortKey } from '../lib/transforms'
import type { Order } from '../lib/types'

const COLS: { key: SortKey; label: string; num?: boolean }[] = [
  { key: 'id', label: 'Order' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'product', label: 'Product' },
  { key: 'channel', label: 'Channel' },
  { key: 'status', label: 'Status' },
  { key: 'units', label: 'Units', num: true },
  { key: 'revenue', label: 'Revenue', num: true },
]
const PAGE = 15

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [key, setKey] = useState<SortKey>('date')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => sortOrders(orders, key, dir), [orders, key, dir])
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE))
  const cur = Math.min(page, pages - 1)
  const rows = sorted.slice(cur * PAGE, cur * PAGE + PAGE)

  const toggle = (k: SortKey) => {
    if (k === key) setDir(dir === 'asc' ? 'desc' : 'asc')
    else { setKey(k); setDir('asc') }
    setPage(0)
  }

  return (
    <section className="card" aria-label="Orders">
      <h2>Orders</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Orders table, scrollable">
        <table>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key} className={c.num ? 'num' : ''} aria-sort={c.key === key ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" onClick={() => toggle(c.key)}>
                    {c.label}<span aria-hidden="true">{c.key === key ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td><td>{o.date}</td><td>{o.customer}</td><td>{o.product}</td><td>{o.channel}</td>
                <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
                <td className="num">{o.units}</td><td className="num">{money2(o.revenue)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={COLS.length} className="empty">No orders match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <span aria-live="polite">{sorted.length.toLocaleString()} orders, page {cur + 1} of {pages}</span>
        <div>
          <button type="button" onClick={() => setPage(cur - 1)} disabled={cur === 0}>Previous</button>
          <button type="button" onClick={() => setPage(cur + 1)} disabled={cur >= pages - 1}>Next</button>
        </div>
      </div>
    </section>
  )
}
