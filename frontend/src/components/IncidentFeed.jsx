import { useEffect, useState } from 'react'
import { incidents as initialIncidents } from '../data/incidents'

function formatElapsed(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss} ago`
}

export default function IncidentFeed() {
  const [incidents, setIncidents] = useState(initialIncidents)

  useEffect(() => {
    const id = setInterval(() => {
      setIncidents((prev) =>
        prev.map((inc) => ({ ...inc, elapsedSeconds: inc.elapsedSeconds + 1 }))
      )
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <aside className="feed">
      <div className="feed-head">
        <h3>Live Incident Feed</h3>
        <span className="feed-count">{incidents.length} Active</span>
      </div>

      <div className="feed-list">
        {incidents.map((inc) => (
          <div className={`incident-card severity-${inc.severity}`} key={inc.id}>
            <div className="ic-top">
              <span className="ic-type">{inc.type}</span>
              <span className="ic-time">{formatElapsed(inc.elapsedSeconds)}</span>
            </div>
            <div className="ic-loc">{inc.location}</div>
            <div className="ic-meta">
              <span className={`badge ${inc.severity}`}>{inc.badge}</span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                ETA {inc.eta}
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {inc.distance}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
