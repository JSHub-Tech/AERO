import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import MapPanel from './components/MapPanel'
import IncidentFeed from './components/IncidentFeed'
import StatBar from './components/StatBar'
import './App.css'

export default function App() {
  const [activeView, setActiveView] = useState('map')

  return (
    <div className="shell">
      <Sidebar active={activeView} onSelect={setActiveView} />
      <Header />
      <MapPanel />
      <IncidentFeed />
      <StatBar />
    </div>
  )
}
