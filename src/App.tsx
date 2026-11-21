import { useEffect, useMemo, useState } from 'react'
import { CategoryBars, ChannelDonut, RevenueTrend, TopProducts } from './components/Charts'
import OrdersTable from './components/OrdersTable'
import { addDays, CATEGORIES, CHANNEL_LIST, DATA_END, generateOrders, STATUS_LIST } from './lib/data'
import { computeKpis, filterOrders, money, money2, revenueSeries, sumBy, toCsv, topProducts } from './lib/transforms'
import type { Filters } from './lib/types'

const ORDERS = generateOrders()
const FIRST_DAY = ORDERS[0]?.date ?? DATA_END
const PRESETS = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'All', days: 0 },
]
const initial: Filters = { from: '', to: '', category: 'All', channel: 'All', status: 'All', search: '' }

type Theme = 'light' | 'dark'
function startTheme(): Theme {
  try {
    const s = localStorage.getItem('theme')
    if (s === 'light' || s === 'dark') return s
  } catch { /* storage blocked */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [f, setF] = useState<Filters>(initial)
  const [theme, setTheme] = useState<Theme>(startTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch { /* storage blocked */ }
  }, [theme])

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((p) => ({ ...p, [k]: v }))
  const rows = useMemo(() => filterOrders(ORDERS, f), [f])
  const kpi = useMemo(() => computeKpis(rows), [rows])
  const series = useMemo(() => revenueSeries(rows), [rows])
  const byCat = useMemo(() => sumBy(rows, (o) => o.category), [rows])
  const byChan = useMemo(() => sumBy(rows, (o) => o.channel), [rows])
  const top = useMemo(() => topProducts(rows), [rows])

  const preset = (days: number) => setF((p) => ({ ...p, from: days ? addDays(DATA_END, -(days - 1)) : '', to: '' }))

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${f.from || FIRST_DAY}-to-${f.to || DATA_END}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="app">
        <header className="top">
          <div>
            <h1>Juniper Street Supply</h1>
            <p className="sub">Sales and operations, {FIRST_DAY} to {DATA_END}. Fictional business, synthetic data.</p>
          </div>
          <button type="button" className="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-pressed={theme === 'dark'}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </header>

        <main id="main">
          <form className="card filters" aria-label="Filters" onSubmit={(e) => e.preventDefault()}>
            <label>From<input type="date" value={f.from} min={FIRST_DAY} max={f.to || DATA_END} onChange={(e) => set('from', e.target.value)} /></label>
            <label>To<input type="date" value={f.to} min={f.from || FIRST_DAY} max={DATA_END} onChange={(e) => set('to', e.target.value)} /></label>
            <label>Category
              <select value={f.category} onChange={(e) => set('category', e.target.value as Filters['category'])}>
                <option>All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Channel
              <select value={f.channel} onChange={(e) => set('channel', e.target.value as Filters['channel'])}>
                <option>All</option>{CHANNEL_LIST.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Status
              <select value={f.status} onChange={(e) => set('status', e.target.value as Filters['status'])}>
                <option>All</option>{STATUS_LIST.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="grow">Search<input type="search" placeholder="Order, customer or product" value={f.search} onChange={(e) => set('search', e.target.value)} /></label>
            <div className="actions">
              {PRESETS.map((p) => <button key={p.label} type="button" className="ghost" onClick={() => preset(p.days)}>{p.label}</button>)}
              <button type="button" className="ghost" onClick={() => setF(initial)}>Reset</button>
              <button type="button" className="primary" onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
            </div>
          </form>

          <section className="kpis" aria-label="Key figures" aria-live="polite">
            <Kpi label="Revenue" value={money(kpi.revenue)} />
            <Kpi label="Orders" value={kpi.orders.toLocaleString()} />
            <Kpi label="Average order" value={money2(kpi.avgOrder)} />
            <Kpi label="Units sold" value={kpi.units.toLocaleString()} />
            <Kpi label="Refund rate" value={`${(kpi.refundRate * 100).toFixed(1)}%`} />
          </section>

          <div className="grid">
            <RevenueTrend data={series} />
            <CategoryBars data={byCat} />
            <ChannelDonut data={byChan} />
            <TopProducts data={top} />
          </div>

          <OrdersTable orders={rows} />
        </main>
        <footer>Built by Chase Builds. Data is generated in the browser from a fixed seed.</footer>
      </div>
    </>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card kpi">
      <span className="sub">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
