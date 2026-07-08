import { useState } from 'react'
import { incidents, responders, routePath } from '../data/incidents'

const LAYERS = [
  { id: 'incidents', label: 'Incidents', color: 'var(--coral)' },
  { id: 'responders', label: 'Responders', color: 'var(--teal)' },
  { id: 'roadblocks', label: 'Roadblocks', color: 'var(--amber)' },
]

export default function MapPanel() {
  const [activeLayers, setActiveLayers] = useState({
    incidents: true,
    responders: true,
    roadblocks: false,
  })

  const toggleLayer = (id) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <section className="map-wrap">
      <div className="map-header">
        <span className="map-eyebrow">Sector Overview</span>
        <span className="map-title display">Lahore Metropolitan Grid</span>
      </div>

      <div className="layer-toggles">
        {LAYERS.map((layer) => (
          <div
            key={layer.id}
            className={`toggle-chip${activeLayers[layer.id] ? ' on' : ''}`}
            onClick={() => toggleLayer(layer.id)}
          >
            <span className="sw" style={{ background: layer.color }} />
            {layer.label}
          </div>
        ))}
      </div>

      <svg className="city-map" viewBox="0 0 900 620" preserveAspectRatio="xMidYMid slice">
        <path className="river" d="M -20 520 C 150 480, 250 560, 420 500 S 700 420, 940 460" />

        <path className="road major" d="M 0 120 H 900" />
        <path className="road major" d="M 0 300 H 900" />
        <path className="road major" d="M 0 460 H 900" />
        <path className="road major" d="M 150 0 V 620" />
        <path className="road major" d="M 430 0 V 620" />
        <path className="road major" d="M 680 0 V 620" />

        <path className="road" d="M 0 60 H 900" />
        <path className="road" d="M 0 195 H 900" />
        <path className="road" d="M 0 380 H 900" />
        <path className="road" d="M 60 0 V 620" />
        <path className="road" d="M 280 0 V 620" />
        <path className="road" d="M 550 0 V 620" />
        <path className="road" d="M 800 0 V 620" />
        <path className="road" d="M 90 0 L 340 620" />
        <path className="road" d="M 700 0 L 480 620" />

        {activeLayers.responders && activeLayers.incidents && (
          <path className="route-path" d={routePath} />
        )}

        {activeLayers.responders &&
          responders.map((r) => (
            <g className="node" key={r.id}>
              <circle className="node-pulse teal" cx={r.x} cy={r.y} r="6" style={{ animationDelay: r.delay }} />
              <circle className="node-core teal" cx={r.x} cy={r.y} r="5.5" />
              <text className="node-label" x={r.x + 12} y={r.y - 3}>
                {r.label}
              </text>
            </g>
          ))}

        {activeLayers.incidents &&
          incidents.map((inc, i) => (
            <g className="node" key={inc.id}>
              <circle
                className="node-pulse coral"
                cx={inc.x}
                cy={inc.y}
                r="6"
                style={{ animationDelay: `${i * 0.45}s` }}
              />
              <circle className="node-core coral" cx={inc.x} cy={inc.y} r="6" />
              <text
                className="node-label"
                x={inc.x + (inc.x > 700 ? -12 : 12)}
                y={inc.y - 3}
                textAnchor={inc.x > 700 ? 'end' : 'start'}
              >
                {inc.type} · {inc.location.split(',')[0]}
              </text>
            </g>
          ))}
      </svg>

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--coral)' }} />
          Active Incident
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--teal)' }} />
          Responder
        </div>
        <div className="legend-item">
          <span
            className="legend-dot"
            style={{ background: 'var(--teal-glow)', boxShadow: '0 0 4px var(--teal-glow)' }}
          />
          Shortest Path
        </div>
      </div>

      <div className="compass">N ↑</div>
    </section>
  )
}
