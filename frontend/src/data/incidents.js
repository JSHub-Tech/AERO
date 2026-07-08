export const incidents = [
  {
    id: 'INC-104',
    type: 'Structure Fire',
    severity: 'high',
    badge: 'Critical',
    location: 'Ferozepur Road, near Kalma Chowk underpass',
    elapsedSeconds: 12 * 60,
    eta: '4m',
    distance: '1.8 km',
    x: 360,
    y: 340,
  },
  {
    id: 'INC-103',
    type: 'Flood Report',
    severity: 'med',
    badge: 'Moderate',
    location: 'Township Sector, block C-2 waterlogged street',
    elapsedSeconds: 3 * 60 + 47,
    eta: '9m',
    distance: '3.2 km',
    x: 800,
    y: 300,
  },
  {
    id: 'INC-102',
    type: 'Food Insecurity',
    severity: 'food',
    badge: 'Needs Aid',
    location: 'Shahdara, household of 6 — no ration for 2 days',
    elapsedSeconds: 8 * 60 + 20,
    eta: '21m',
    distance: '5.6 km',
    x: 90,
    y: 120,
  },
  {
    id: 'INC-101',
    type: 'Roadblock',
    severity: 'med',
    badge: 'Reroute',
    location: 'Canal Bank Road, fallen tree blocking 2 lanes',
    elapsedSeconds: 11 * 60 + 2,
    eta: '—',
    distance: '4.0 km',
    x: 430,
    y: 460,
  },
]

export const responders = [
  { id: 'AMB-04', label: 'AMB-04 · Gulberg', x: 680, y: 195, delay: '0s' },
  { id: 'AMB-11', label: 'AMB-11 · Model Town', x: 150, y: 380, delay: '0.6s' },
  { id: 'VOL-02', label: 'VOL-02 · Johar Town', x: 550, y: 60, delay: '1.1s' },
]

export const routePath = 'M 680 195 L 610 195 L 610 260 L 500 260 L 500 300 L 430 300 L 430 340 L 360 340'

export const stats = [
  {
    label: 'Active Incidents',
    value: '4',
    unit: '',
    trend: '↑ 2 in last hour',
    trendType: 'up',
    accent: 'var(--coral)',
  },
  {
    label: 'Avg Response Time',
    value: '6',
    unit: 'min 40s',
    trend: '↓ 18% vs last week',
    trendType: 'down',
    accent: 'var(--teal)',
  },
  {
    label: 'Responders Deployed',
    value: '7',
    unit: '/ 12 units',
    trend: '→ 5 on standby',
    trendType: 'neutral',
    accent: 'var(--teal)',
  },
  {
    label: 'Roads Impassable',
    value: '3',
    unit: 'segments',
    trend: '↑ Ferozepur Rd added',
    trendType: 'up',
    accent: 'var(--amber)',
  },
]
