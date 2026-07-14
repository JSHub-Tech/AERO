import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Airports from './pages/Airports';
import LiveOperations from './pages/LiveOperations';
import Booking from './pages/Booking';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/airports" element={<Airports />} />
          <Route path="/live-ops" element={<LiveOperations />} />
          <Route path="/booking" element={<Booking />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
