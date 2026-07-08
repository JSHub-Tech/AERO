import { stats } from '../data/incidents'

export default function StatBar() {
  return (
    <footer className="statbar">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <span className="accent-bar" style={{ background: stat.accent }} />
          <span className="stat-label">{stat.label}</span>
          <span className="stat-value">
            {stat.value}
            {stat.unit && <span className="unit">{stat.unit}</span>}
          </span>
          <span
            className={`stat-trend ${stat.trendType}`}
            style={stat.trendType === 'neutral' ? { color: 'var(--text-mid)' } : undefined}
          >
            {stat.trend}
          </span>
        </div>
      ))}
    </footer>
  )
}
