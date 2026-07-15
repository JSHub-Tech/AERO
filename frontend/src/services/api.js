import axios from 'axios';
import Papa from 'papaparse';

// ==========================================
// AERO SYS - CENTRAL API SERVICE LAYER
// ==========================================

// When your backend teammates finish the real database, 
// just change this to `false` and the entire frontend will 
// instantly switch to the live backend!
export const USE_MOCK_DATA = true;

const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper to fetch and parse local CSVs to mimic backend responses
const fetchMockCsv = async (url) => {
  const res = await fetch(url);
  const csv = await res.text();
  return new Promise((resolve) => {
    Papa.parse(csv, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      }
    });
  });
};

// ------------------------------------------
// ENDPOINTS
// ------------------------------------------

export const getAirports = async () => {
  if (USE_MOCK_DATA) {
    const data = await fetchMockCsv('/airport.csv');
    return data.filter(a => a.Airport_Code && a.City);
  }
  const response = await API.get('/airports');
  return response.data;
};

export const getRoutes = async () => {
  if (USE_MOCK_DATA) {
    const data = await fetchMockCsv('/routes.csv');
    return data.filter(r => r.Source_Airport_Code && r.Destination_Airport_Code);
  }
  const response = await API.get('/routes');
  return response.data;
};

export const getFleets = async () => {
  if (USE_MOCK_DATA) {
    const data = await fetchMockCsv('/fleet.csv');
    return data.filter(f => f.Aircraft_ID);
  }
  const response = await API.get('/fleets');
  return response.data;
};

export const getFlightSchedule = async () => {
  if (USE_MOCK_DATA) {
    // Generate some mock live flights based on routes
    const routes = await getRoutes();
    return routes.slice(0, 10).map((r, i) => ({
      id: `PK${300 + i}`,
      src: r.Source_Airport_Code,
      dst: r.Destination_Airport_Code,
      status: 'En Route',
      altitude: '35,000 ft',
      speed: '540 knots'
    }));
  }
  const response = await API.get('/flights/schedule');
  return response.data;
};

export const sendChatMessage = async (message) => {
  if (USE_MOCK_DATA) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ text: "I am AERO AI. I am currently operating in offline simulation mode while my backend telemetry API is being configured.", sender: 'ai' });
      }, 800);
    });
  }
  const response = await API.post('/chat', { message });
  return response.data;
};

export const getAirportDetails = async () => {
  if (USE_MOCK_DATA) {
    const data = await fetchMockCsv('/airport_details.csv');
    return data;
  }
  const response = await API.get('/airports/details');
  return response.data;
};

// --- Live Operations Dashboard Endpoints ---
export const getActiveFlights = async () => {
  if (USE_MOCK_DATA) {
    return { flights: [] }; // Mock empty dashboard for now
  }
  const response = await API.get('/dashboard/active-flights');
  return response.data;
};

export const getOnboardingFlights = async () => {
  if (USE_MOCK_DATA) {
    return { flights: [] }; // Mock empty dashboard for now
  }
  const response = await API.get('/dashboard/onboarding-flights');
  return response.data;
};

export const getDelayedFlights = async () => {
  if (USE_MOCK_DATA) {
    return { flights: [] }; // Mock empty dashboard for now
  }
  const response = await API.get('/dashboard/delayed-flights');
  return response.data;
};

// --- Booking Endpoints ---
export const searchFlights = async (origin, destination, date, passengers) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (origin === destination) {
          return reject(new Error("Origin and Destination cannot be the same."));
        }
        
        // Mock flights fallback
        resolve([
          { id: 'PK300', departureTime: '08:00 AM', arrivalTime: '10:00 AM', duration: '2h 0m', price: '$120', path: [origin, destination], type: 'Direct', plane: 'A320-01' },
          { id: 'PK302', departureTime: '01:30 PM', arrivalTime: '04:45 PM', duration: '3h 15m', price: '$145', path: [origin, 'DXB', destination], type: '1 Stop', plane: 'B777-01' },
          { id: 'PK304', departureTime: '06:00 PM', arrivalTime: '08:15 PM', duration: '2h 15m', price: '$95', path: [origin, destination], type: 'Direct', plane: 'ATR-01' }
        ]);
      }, 800);
    });
  }
  
  const response = await API.get('/flights/search', {
    params: { origin, destination, date, passengers }
  });
  return response.data;
};
