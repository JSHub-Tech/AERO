import { useState, useEffect, useMemo } from 'react';
import { getAirports, getFleets, searchFlights, bookFlight } from '../services/api';
import Footer from '../components/Footer';
import { Plane, Calendar, Users, ArrowRight, CheckCircle2, ChevronRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function Booking() {
  const [step, setStep] = useState(1);
  const [airports, setAirports] = useState([]);
  const [fleets, setFleets] = useState([]);
  
  // Form State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [flexibility, setFlexibility] = useState('0');
  
  // Selection State
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [hoveredFlight, setHoveredFlight] = useState(null);
  
  const [availableFlights, setAvailableFlights] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  const [isBooking, setIsBooking] = useState(false);
  const [pnr, setPnr] = useState('');

  // Load Data via API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [airportsData, fleetsData] = await Promise.all([
          getAirports(),
          getFleets()
        ]);
        setAirports(airportsData);
        setFleets(fleetsData);
      } catch (error) {
        console.error("Error loading booking data:", error);
      }
    };
    fetchData();
  }, []);

  const airportCoords = useMemo(() => {
    const coords = {};
    airports.forEach(a => {
      if (a.Airport_Code && a.Latitude && a.Longitude) {
        coords[a.Airport_Code] = [parseFloat(a.Latitude), parseFloat(a.Longitude)];
      }
    });
    return coords;
  }, [airports]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (origin && destination && date) {
      setIsSearching(true);
      setSearchError('');
      try {
        const flights = await searchFlights(origin, destination, date, passengers);
        setAvailableFlights(flights);
        setStep(2);
      } catch (err) {
        setSearchError(err.message || 'Error searching flights');
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleSelectFlight = (flight) => {
    setSelectedFlight(flight);
    setStep(3);
  };

  const handleCheckout = async () => {
    setIsBooking(true);
    try {
      const result = await bookFlight(selectedFlight.id, selectedSeats, passengers);
      setPnr(result.pnr || `AERO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
      setStep(4);
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to book flight. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length < passengers) {
        setSelectedSeats([...selectedSeats, seatId]);
      }
    }
  };

  const renderSeatMap = () => {
    if (!selectedFlight) return null;
    
    const aircraft = fleets.find(f => f.Aircraft_ID === selectedFlight.plane);
    const totalSeats = aircraft ? parseInt(aircraft.Total_Seats) : 170;
    
    let seatsPerRow = 6;
    let aisles = [3]; // After seat C
    
    if (totalSeats > 300) { // Boeing 777
      seatsPerRow = 9;
      aisles = [3, 6]; // 3-3-3 layout
    } else if (totalSeats < 100) { // ATR
      seatsPerRow = 4;
      aisles = [2]; // 2-2 layout
    }
    
    // Reduce rows slightly just for UI demo purposes so it doesn't take 10 pages to scroll
    const demoRows = Math.min(Math.ceil(totalSeats / seatsPerRow), 15);
    const seatMap = [];

    for (let r = 1; r <= demoRows; r++) {
      const rowSeats = [];
      for (let s = 0; s < seatsPerRow; s++) {
        const letter = String.fromCharCode(65 + s);
        const seatId = `${r}${letter}`;
        const isSelected = selectedSeats.includes(seatId);
        const isUnavailable = (r * s) % 7 === 0 && !isSelected;
        
        rowSeats.push(
          <button
            key={seatId}
            disabled={isUnavailable}
            onClick={() => toggleSeat(seatId)}
            className={`w-9 h-11 m-1 rounded-t-lg rounded-b-sm font-bold text-[10px] transition-all flex items-center justify-center ${
              isUnavailable ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
              isSelected ? 'bg-[#004F30] text-white shadow-md transform -translate-y-1' :
              'bg-blue-50 text-[#004F30] border border-blue-100 hover:bg-blue-100'
            }`}
          >
            {seatId}
          </button>
        );
        if (aisles.includes(s + 1)) {
          rowSeats.push(<div key={`aisle-${r}-${s}`} className="w-6"></div>);
        }
      }
      seatMap.push(<div key={r} className="flex justify-center">{rowSeats}</div>);
    }
    return seatMap;
  };

  const renderMiniMap = () => {
    const flightToRender = hoveredFlight || availableFlights[0];
    const pathCoords = (flightToRender?.path || []).map(code => airportCoords[code]).filter(Boolean);
    
    if (pathCoords.length < 2) return <div className="w-full h-full bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 font-bold">Map Data Unavailable</div>;

    const bounds = L.latLngBounds(pathCoords);

    return (
      <div className="w-full h-full rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative z-0">
        <MapContainer bounds={bounds} boundsOptions={{ padding: [50, 50] }} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
          />
          <Polyline positions={pathCoords} color="#004F30" weight={3} dashArray="5, 10" className="animate-pulse" />
          
          {pathCoords.map((coord, idx) => (
            <Marker key={idx} position={coord} />
          ))}
        </MapContainer>
        <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-[#1C2B22] shadow-sm">
          {flightToRender.path.join(' ➔ ')}
        </div>
      </div>
    );
  };

  const getAircraftModel = (planeId) => {
    const aircraft = fleets.find(f => f.Aircraft_ID === planeId);
    return aircraft ? aircraft.Model : 'Unknown Aircraft';
  };

  return (
    <div className="w-full min-h-screen pt-28 bg-[#F8F9FA] flex flex-col">
      <div className="max-w-6xl mx-auto px-4 flex-grow w-full pb-20">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative max-w-5xl mx-auto">
          <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
          <div className="absolute left-0 top-1/2 h-1 bg-[#004F30] -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {['Search', 'Select', 'Seats', 'Checkout'].map((label, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step > i ? 'bg-[#004F30] text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                {step > i + 1 ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-xs mt-2 font-bold uppercase tracking-wider ${step >= i + 1 ? 'text-[#1C2B22]' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Search */}
        {step === 1 && (
          <div className="bg-white p-10 rounded-3xl shadow-[0_10px_40px_rgba(0,79,48,0.06)] border border-gray-100 animate-fade-in max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#1C2B22] mb-8">Where are you flying?</h2>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Origin</label>
                <div className="relative">
                  <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select required value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-4 pl-12 pr-2 text-[#1C2B22] font-medium focus:ring-2 focus:ring-[#004F30]/20 outline-none appearance-none cursor-pointer text-sm">
                    <option value="">Origin</option>
                    {airports.map(a => <option key={a.Airport_Code} value={a.Airport_Code}>{a.City} ({a.Airport_Code})</option>)}
                  </select>
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Destination</label>
                <div className="relative">
                  <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transform rotate-90" />
                  <select required value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-4 pl-12 pr-2 text-[#1C2B22] font-medium focus:ring-2 focus:ring-[#004F30]/20 outline-none appearance-none cursor-pointer text-sm">
                    <option value="">Dest</option>
                    {airports.map(a => <option key={a.Airport_Code} value={a.Airport_Code}>{a.City} ({a.Airport_Code})</option>)}
                  </select>
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-4 pl-12 pr-2 text-[#1C2B22] font-medium focus:ring-2 focus:ring-[#004F30]/20 outline-none text-sm" />
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Flexibility</label>
                <div className="relative">
                  <select value={flexibility} onChange={e => setFlexibility(e.target.value)} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-4 px-4 text-[#1C2B22] font-medium focus:ring-2 focus:ring-[#004F30]/20 outline-none appearance-none cursor-pointer text-sm text-center">
                    <option value="0">Exact Dates</option>
                    <option value="1">+/- 1 Day</option>
                    <option value="3">+/- 3 Days</option>
                    <option value="7">+/- 1 Week</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Passengers</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input required type="number" min="1" max="9" value={passengers} onChange={e => setPassengers(parseInt(e.target.value))} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-4 pl-12 pr-2 text-[#1C2B22] font-medium focus:ring-2 focus:ring-[#004F30]/20 outline-none text-sm" />
                </div>
              </div>

              {searchError && (
                <div className="md:col-span-5 mb-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">
                  {searchError}
                </div>
              )}

              <div className="md:col-span-5 mt-4 text-right">
                <button type="submit" disabled={isSearching} className="px-10 py-4 bg-[#004F30] hover:bg-[#1C2B22] text-white font-bold tracking-widest rounded-xl transition-all shadow-lg inline-flex items-center gap-3 disabled:opacity-70">
                  {isSearching ? 'SEARCHING...' : 'SEARCH FLIGHTS'} <ArrowRight className="w-5 h-5" />
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Step 2: Flight Results */}
        {step === 2 && (
          <div className="animate-fade-in">
            <button onClick={() => setStep(1)} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#1C2B22] uppercase tracking-wider transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Flight List */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-[#1C2B22] mb-2">Select your flight</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">Showing available flights from {origin} to {destination} ({flexibility === '0' ? 'Exact Dates' : `Flexible by +/- ${flexibility} days`})</p>
                
                {availableFlights.length === 0 ? (
                   <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-medium">
                     No flights available for this route.
                   </div>
                ) : (
                  availableFlights.map((flight) => (
                    <div 
                      key={flight.id} 
                      onClick={() => handleSelectFlight(flight)}
                      onMouseEnter={() => setHoveredFlight(flight)}
                      onMouseLeave={() => setHoveredFlight(null)}
                      className="bg-white border-2 border-gray-100 p-6 rounded-2xl hover:border-[#004F30] hover:shadow-lg transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-xl font-bold text-[#1C2B22]">{flight.departureTime}</div>
                          <div className="text-sm text-gray-400 font-bold tracking-wider">{origin}</div>
                        </div>
                        
                        <div className="flex flex-col items-center px-4">
                          <div className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">{flight.duration}</div>
                          <div className="w-24 h-[2px] bg-gray-200 relative">
                            <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-[#004F30]" />
                          </div>
                          <div className={`text-[10px] font-bold mt-1 ${flight.type === 'Direct' ? 'text-[#004F30]' : 'text-[#A89411]'}`}>{flight.type}</div>
                        </div>

                        <div>
                          <div className="text-xl font-bold text-[#1C2B22]">{flight.arrivalTime}</div>
                          <div className="text-sm text-gray-400 font-bold tracking-wider">{destination}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-gray-400 font-bold uppercase">From</div>
                          <div className="text-2xl font-bold text-[#1C2B22]">{flight.price}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#F8F9FA] group-hover:bg-[#004F30] flex items-center justify-center transition-colors">
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="hidden md:block h-[500px] sticky top-32">
                {renderMiniMap()}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Seat Selection */}
        {step === 3 && (
          <div className="animate-fade-in max-w-5xl mx-auto">
            <button onClick={() => { setStep(2); setSelectedSeats([]); }} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#1C2B22] uppercase tracking-wider transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Flights
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-white p-10 rounded-3xl shadow-[0_10px_40px_rgba(0,79,48,0.06)] border border-gray-100 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-[#1C2B22] mb-2">Select your seats</h2>
                <p className="text-gray-500 font-medium mb-2">Please choose {passengers} seat(s)</p>
                <div className="text-sm font-bold bg-[#F8F9FA] text-[#004F30] px-4 py-2 rounded-full mb-8 flex items-center gap-2 border border-gray-200">
                  <Plane className="w-4 h-4" /> {selectedFlight?.plane} • {getAircraftModel(selectedFlight?.plane)}
                </div>
                
                <div className="bg-[#F8F9FA] p-8 rounded-[40px] border-4 border-gray-200 w-full max-w-lg relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 bg-gray-200 rounded-b-full"></div>
                  <div className="mt-8 space-y-2 w-full flex flex-col items-center">
                    {renderSeatMap()}
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-[#1C2B22] mb-6 border-b pb-4">Flight Summary</h3>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-500 font-medium">Flight</span>
                    <span className="font-bold text-[#1C2B22]">{selectedFlight?.id}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-500 font-medium">Aircraft</span>
                    <span className="font-bold text-[#1C2B22] text-right text-sm">{getAircraftModel(selectedFlight?.plane)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-500 font-medium">Route</span>
                    <span className="font-bold text-[#1C2B22]">{origin} &rarr; {destination}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-500 font-medium">Passengers</span>
                    <span className="font-bold text-[#1C2B22]">{passengers}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-500 font-medium">Selected Seats</span>
                    <span className="font-bold text-[#004F30]">
                      {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                    </span>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-dashed">
                    <div className="flex justify-between items-end">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-sm">Total Price</span>
                      <span className="text-3xl font-bold text-[#1C2B22]">${parseInt(selectedFlight?.price.replace('$','')) * passengers}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={selectedSeats.length !== passengers || isBooking}
                  className={`w-full py-5 font-bold tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    selectedSeats.length === passengers 
                    ? 'bg-[#004F30] hover:bg-[#1C2B22] text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  } ${isBooking ? 'opacity-70' : ''}`}
                >
                  {isBooking ? 'PROCESSING...' : 'CONTINUE TO CHECKOUT'} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Checkout & Success */}
        {step === 4 && (
          <div className="animate-fade-in max-w-2xl mx-auto flex-grow flex flex-col items-center justify-center pt-10">
            <button onClick={() => { setStep(3); setPnr(''); }} className="mb-6 self-start inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#1C2B22] uppercase tracking-wider transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Seats
            </button>
            <div className="bg-white p-16 rounded-3xl shadow-[0_10px_40px_rgba(0,79,48,0.06)] border border-gray-100 text-center w-full">
              <div className="w-24 h-24 bg-[#004F30]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-12 h-12 text-[#004F30]" />
              </div>
              <h2 className="text-4xl font-bold text-[#1C2B22] mb-4">Booking Confirmed!</h2>
              <p className="text-gray-500 text-lg font-medium mb-10 leading-relaxed">
                Your flight from <strong>{origin}</strong> to <strong>{destination}</strong> aboard a <strong>{getAircraftModel(selectedFlight?.plane)}</strong> has been successfully booked. Your e-tickets for seats <strong>{selectedSeats.join(', ')}</strong> have been sent to your email.
              </p>
              
              <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-gray-200 mb-10 flex items-center justify-between text-left">
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Booking Reference (PNR)</div>
                  <div className="text-2xl font-mono font-bold text-[#1C2B22]">{pnr}</div>
                </div>
                <Plane className="w-10 h-10 text-[#004F30] opacity-20 transform rotate-45" />
              </div>

              <button onClick={() => { setStep(1); setOrigin(''); setDestination(''); setDate(''); setSelectedSeats([]); setPnr(''); }} className="px-10 py-4 bg-[#004F30] hover:bg-[#1C2B22] text-white font-bold tracking-widest rounded-xl transition-all shadow-lg">
                BOOK ANOTHER FLIGHT
              </button>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
