import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { money } from '../lib/transforms'
import type { Point } from '../lib/types'

const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)']
const tip = { contentStyle: { background: 'var(--panel-solid)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)' } }
const fmt = (v: unknown) => money(Number(v))

function Card({ title, desc, children, empty }: { title: string; desc: string; children: React.ReactNode; empty: boolean }) {
  return (
    <section className="card chart" aria-label={title}>
      <h2>{title}</h2>
      <p className="sub">{desc}</p>
      {empty ? <p className="empty">No data for these filters.</p> : <div className="plot">{children}</div>}
    </section>
  )
}

export function RevenueTrend({ data }: { data: Point[] }) {
  return (
    <Card title="Revenue over time" desc="Daily for short ranges, weekly for long ones. Refunds excluded." empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c1)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--c1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(s: string) => s.slice(5)} minTickGap={24} />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={fmt} width={62} />
          <Tooltip {...tip} formatter={fmt} />
          <Area isAnimationActive={false} type="monotone" dataKey="value" name="Revenue" stroke="var(--c1)" strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function CategoryBars({ data }: { data: Point[] }) {
  return (
    <Card title="Revenue by category" desc="Total revenue per product category." empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={fmt} width={62} />
          <Tooltip {...tip} formatter={fmt} cursor={{ fill: 'var(--line)' }} />
          <Bar isAnimationActive={false} dataKey="value" name="Revenue" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function ChannelDonut({ data }: { data: Point[] }) {
  const total = data.reduce((s, p) => s + p.value, 0)
  return (
    <Card title="Sales channels" desc="Share of revenue by channel." empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie isAnimationActive={false} data={data} dataKey="value" nameKey="label" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip {...tip} formatter={fmt} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="legend">
        {data.map((p, i) => (
          <li key={p.label}>
            <span className="dot" style={{ background: COLORS[i % COLORS.length] }} />
            {p.label} {total ? Math.round((p.value / total) * 100) : 0}%
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function TopProducts({ data }: { data: Point[] }) {
  return (
    <Card title="Top products" desc="Five best sellers by revenue." empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8 }}>
          <CartesianGrid stroke="var(--line)" horizontal={false} />
          <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={fmt} />
          <YAxis type="category" dataKey="label" width={128} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
          <Tooltip {...tip} formatter={fmt} cursor={{ fill: 'var(--line)' }} />
          <Bar isAnimationActive={false} dataKey="value" name="Revenue" fill="var(--c2)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
