import { useEffect, useState } from 'react';
import { AlertTriangle, Ban, Pencil, Plus } from 'lucide-react';
import { getFlightsAdmin, getFleetAdmin, cancelFlight } from '../../services/api';
import { SearchBox, Pagination, StatusBadge, ConfirmModal } from './shared';
import DelayModal from './DelayModal';
import FlightFormModal from './FlightFormModal';

const PAGE_SIZE = 10;

export default function FlightsTab({ adminUserId }) {
  const [flights, setFlights] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');

  const [delayTarget, setDelayTarget] = useState(null);
  const [formTarget, setFormTarget] = useState(null); // null=closed, 'new', or a flight object
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [flightsData, aircraftData] = await Promise.all([getFlightsAdmin(), getFleetAdmin()]);
      setFlights(flightsData);
      setAircraft(aircraftData.filter(a => a.status === 'active'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleCancelFlight = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelFlight(cancelTarget.flight_id, 'Cancelled by admin');
      setCancelTarget(null);
      flash(`Flight ${cancelTarget.flight_number} cancelled.`);
      load();
    } catch (err) {
      alert('Failed to cancel flight: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCancelling(false);
    }
  };

  const filtered = flights.filter(f =>
    f.flight_number.toLowerCase().includes(search.toLowerCase()) ||
    f.departure_airport.toLowerCase().includes(search.toLowerCase()) ||
    f.arrival_airport.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl font-bold text-sm border border-green-200">{successMsg}</div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-[#0A6B41] flex flex-wrap gap-4 items-center justify-between bg-[#004F30]">
          <h2 className="text-sm font-black tracking-widest uppercase text-[#A89411]">All Flights</h2>
          <div className="flex items-center gap-3">
            <SearchBox value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search flight or airport..." />
            <button
              onClick={() => setFormTarget('new')}
              disabled={aircraft.length === 0}
              title={aircraft.length === 0 ? 'Add an active aircraft first' : ''}
              className="flex items-center gap-2 px-4 py-2 bg-[#A89411] hover:bg-[#D4C345] disabled:bg-[#A89411]/50 disabled:text-[#1C2B22]/50 text-[#1C2B22] rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors shadow-md border border-[#A89411]"
            >
              <Plus size={14} /> New Flight
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#004F30] text-[10px] uppercase font-black tracking-widest text-white/80">
              <tr>
                <th className="p-4">Flight</th>
                <th className="p-4">Route</th>
                <th className="p-4">Status</th>
                <th className="p-4">Departure</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-bold">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-bold">No flights found.</td></tr>
              ) : (
                paginated.map((f) => {
                  const done = f.status === 'completed' || f.status === 'cancelled';
                  return (
                    <tr key={f.flight_id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-black text-[#1C2B22]">{f.flight_number}</td>
                      <td className="p-4 font-bold text-[#1C2B22]/80">{f.departure_airport} ➔ {f.arrival_airport}</td>
                      <td className="p-4"><StatusBadge status={f.status} /></td>
                      <td className="p-4 font-bold text-[#1C2B22]/60">{new Date(f.scheduled_departure).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-4 font-black text-[#A89411]">${f.base_price}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={done}
                            onClick={() => setDelayTarget({ id: f.flight_id, flightNum: f.flight_number })}
                            title="Inject delay"
                            className="p-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <AlertTriangle size={14} />
                          </button>
                          <button
                            disabled={done}
                            onClick={() => setFormTarget(f)}
                            title="Edit / reschedule"
                            className="p-2 bg-[#A89411]/20 text-[#A89411] hover:bg-[#A89411] hover:text-[#1C2B22] rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            disabled={done}
                            onClick={() => setCancelTarget(f)}
                            title="Cancel flight"
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <Ban size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
            rangeLabel={`Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          />
        )}
      </div>

      {delayTarget && (
        <DelayModal
          flight={delayTarget}
          adminUserId={adminUserId}
          onClose={() => setDelayTarget(null)}
          onDone={(msg) => { setDelayTarget(null); flash(msg); load(); }}
        />
      )}

      {formTarget && (
        <FlightFormModal
          flight={formTarget === 'new' ? null : formTarget}
          aircraftOptions={aircraft}
          onClose={() => setFormTarget(null)}
          onDone={(msg) => { setFormTarget(null); flash(msg); load(); }}
        />
      )}

      {cancelTarget && (
        <ConfirmModal
          title="Cancel Flight"
          description={`Flight ${cancelTarget.flight_number} — bookings will be marked cancelled`}
          confirmLabel="Confirm Cancellation"
          busy={cancelling}
          onConfirm={handleCancelFlight}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
