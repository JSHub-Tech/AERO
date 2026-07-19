import axios from 'axios';
import Papa from 'papaparse';

// ==========================================
// AERO SYS - CENTRAL API SERVICE LAYER
// ==========================================

// When your backend teammates finish the real database, 
// just change this to `false` and the entire frontend will 
// instantly switch to the live backend!
export const USE_MOCK_DATA = false;

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// The backend's `get_current_user` dependency (see app/api/dependencies.py)
// authenticates requests off an `X-User-Id` header rather than a bearer
// token. Attach it here, once, for every request — instead of requiring
// every single call site to remember to pass it manually. Booking checkout
// was silently 401ing against the real backend because bookFlight() never
// sent this header; this interceptor fixes that and prevents the same bug
// from recurring on any future authenticated endpoint.
// `!config.headers['X-User-Id']` keeps this from clobbering a header a
// caller has explicitly set on purpose (e.g. delayFlight's adminUserId).
API.interceptors.request.use((config) => {
  if (!config.headers['X-User-Id']) {
    try {
      const storedUser = localStorage.getItem('aero_user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (user?.user_id) {
        config.headers['X-User-Id'] = user.user_id;
      }
    } catch {
      // Corrupt/missing localStorage — just proceed unauthenticated and
      // let the backend return its normal 401.
    }
  }
  return config;
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

export const sendChatMessage = async (messages) => {
  if (USE_MOCK_DATA) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ text: "I am AERO AI. I am currently operating in offline simulation mode while my backend telemetry API is being configured.", sender: 'ai' });
      }, 800);
    });
  }
  const response = await API.post('/chat', { messages });
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

export const bookFlight = async (flightId, seats, passengers) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, pnr: `AERO-${Math.random().toString(36).substr(2, 6).toUpperCase()}` });
      }, 1500);
    });
  }
  const response = await API.post('/flights/book', { flightId, seats, passengers });
  return response.data;
};

export const getFlightSeats = async (flightId) => {
  if (USE_MOCK_DATA) {
    return { booked_seats: [] };
  }
  const response = await API.get(`/flights/seats/${flightId}`);
  return response.data;
};

// --- Auth Endpoints ---
export const authLogin = async (email, password) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user_id: 'mock-uuid-1234',
          email,
          role: email === 'admin@aero.com' ? 'admin' : 'user'
        });
      }, 800);
    });
  }
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const authSignup = async (email, password) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user_id: 'mock-uuid-' + Math.random().toString(36).slice(2, 8),
          email,
          role: 'user',
          created_at: new Date().toISOString()
        });
      }, 800);
    });
  }
  const response = await API.post('/auth/signup', { email, password });
  return response.data;
};

// --- Admin Endpoints ---
export const delayFlight = async (flightId, delayMinutes, delayReason, adminUserId) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ message: 'Mock delay successful' }), 800);
    });
  }
  const response = await API.post(`/flights/${flightId}/delay`, 
    { delay_minutes: delayMinutes, delay_reason: delayReason },
    { headers: { 'X-User-Id': adminUserId } }
  );
  return response.data;
};

// --- Admin: Dashboard summary (Command Center overview cards) ---
export const getDashboardSummary = async () => {
  const response = await API.get('/dashboard/summary');
  return response.data;
};

// --- Admin: Fleet CRUD ---
export const getFleetAdmin = async () => {
  const response = await API.get('/fleets/admin');
  return response.data;
};

export const createAircraft = async (payload) => {
  const response = await API.post('/fleets', payload);
  return response.data;
};

export const updateAircraft = async (aircraftId, payload) => {
  const response = await API.patch(`/fleets/${aircraftId}`, payload);
  return response.data;
};

export const retireAircraft = async (aircraftId) => {
  const response = await API.delete(`/fleets/${aircraftId}`);
  return response.data;
};

// --- Admin: Flight CRUD ---
export const getFlightsAdmin = async () => {
  const response = await API.get('/flights/admin');
  return response.data;
};

export const createFlight = async (payload) => {
  const response = await API.post('/flights', payload);
  return response.data;
};

export const updateFlight = async (flightId, payload) => {
  const response = await API.patch(`/flights/${flightId}`, payload);
  return response.data;
};

export const cancelFlight = async (flightId, reason) => {
  const response = await API.post(`/flights/${flightId}/cancel`, { reason });
  return response.data;
};

// --- Admin: Bookings ---
// GET /flights (root, no path segment) returns bookings — admins see every
// booking, regular users see only their own. Matches the backend's existing
// mount of bookings.router under the /flights prefix.
export const getBookings = async () => {
  const response = await API.get('/flights');
  return response.data;
};

export const cancelBooking = async (bookingId) => {
  const response = await API.delete(`/flights/${bookingId}`);
  return response.data;
};

// --- Admin: Users ---
export const getUsers = async () => {
  const response = await API.get('/users');
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await API.patch(`/users/${userId}/role`, { role });
  return response.data;
};

export const updateUserStatus = async (userId, isActive) => {
  const response = await API.patch(`/users/${userId}/status`, { is_active: isActive });
  return response.data;
};