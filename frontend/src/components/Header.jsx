import { useEffect, useState } from 'react'
import logo from '../assets/Logo.png'

export default function Header() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <img src={logo} alt="NOVIS logo" className="brand-logo" />
        <div className="title">
          NOVIS <span className="sub">Live Geo-Dispatch Command Center — Lahore</span>
        </div>
      </div>

      <div className="status-pill">
        <span className="status-dot" />
        LIVE · 12 NODES CONNECTED
      </div>

      <div className="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="Search sector, road, or report ID…" />
      </div>

      <div className="right-cluster">
        <div className="clock mono">
          {time.toLocaleTimeString('en-GB', { hour12: false })}
        </div>
        <button className="dispatch-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Report Incident
        </button>
      </div>
    </header>
  )
}
