import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Airports from './pages/Airports';
import LiveOperations from './pages/LiveOperations';
import Booking from './pages/Booking';
import Fleet from './pages/Fleet';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/airports" element={<Airports />} />
          <Route path="/live-ops" element={<LiveOperations />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
