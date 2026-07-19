import { useEffect, useState } from 'react';
import { Ban } from 'lucide-react';
import { getBookings, cancelBooking } from '../../services/api';
import { SearchBox, Pagination, StatusBadge, ConfirmModal } from './shared';

const PAGE_SIZE = 10;

export default function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setBookings(await getBookings());
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

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelBooking(cancelTarget.booking_id);
      setCancelTarget(null);
      flash(`Booking ${cancelTarget.booking_reference} cancelled — seat released.`);
      load();
    } catch (err) {
      alert('Failed to cancel booking: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCancelling(false);
    }
  };

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    return (
      b.booking_reference?.toLowerCase().includes(q) ||
      b.flight_number?.toLowerCase().includes(q) ||
      b.account_email?.toLowerCase().includes(q) ||
      b.passenger_name?.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl font-bold text-sm border border-green-200">{successMsg}</div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
          <h2 className="text-sm font-black tracking-widest uppercase text-gray-400">All Bookings</h2>
          <SearchBox value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="PNR, flight, or email..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
              <tr>
                <th className="p-4">PNR</th>
                <th className="p-4">Flight</th>
                <th className="p-4">Passenger</th>
                <th className="p-4">Account</th>
                <th className="p-4">Seat</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400 font-bold">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400 font-bold">No bookings found.</td></tr>
              ) : (
                paginated.map((b) => (
                  <tr key={b.booking_id} className="hover:bg-gray-50">
                    <td className="p-4 font-black text-[#1C2B22]">{b.booking_reference}</td>
                    <td className="p-4 font-bold text-gray-600">
                      {b.flight_number}
                      {b.departure_airport && <span className="text-gray-400"> · {b.departure_airport}➔{b.arrival_airport}</span>}
                    </td>
                    <td className="p-4 font-bold text-gray-600">{b.passenger_name || '—'}</td>
                    <td className="p-4 font-bold text-gray-500">{b.account_email || '—'}</td>
                    <td className="p-4 font-bold text-gray-500">{b.seat_number || '—'}</td>
                    <td className="p-4 font-bold text-gray-500">${b.price_paid}</td>
                    <td className="p-4"><StatusBadge status={b.status} /></td>
                    <td className="p-4 text-right">
                      <button
                        disabled={b.status === 'cancelled'}
                        onClick={() => setCancelTarget(b)}
                        title="Cancel booking"
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors ml-auto"
                      >
                        <Ban size={14} />
                      </button>
                    </td>
                  </tr>
                ))
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

      {cancelTarget && (
        <ConfirmModal
          title="Cancel Booking"
          description={`PNR ${cancelTarget.booking_reference} — seat will be released for re-sale`}
          confirmLabel="Confirm Cancellation"
          busy={cancelling}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
