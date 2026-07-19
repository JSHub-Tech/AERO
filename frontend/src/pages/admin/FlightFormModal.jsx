import { useState } from 'react';
import { X, PlaneTakeoff } from 'lucide-react';
import { createFlight, updateFlight } from '../../services/api';

// datetime-local inputs need "YYYY-MM-DDTHH:mm" with no timezone/seconds.
const toLocalInput = (iso) => (iso ? iso.slice(0, 16) : '');

export default function FlightFormModal({ flight, aircraftOptions, onClose, onDone }) {
  const isEdit = Boolean(flight);
  const [form, setForm] = useState({
    flight_number: flight?.flight_number || '',
    aircraft_id: flight?.aircraft_id || (aircraftOptions[0]?.aircraft_id ?? ''),
    departure_airport: flight?.departure_airport || '',
    arrival_airport: flight?.arrival_airport || '',
    scheduled_departure: toLocalInput(flight?.scheduled_departure),
    scheduled_arrival: toLocalInput(flight?.scheduled_arrival),
    base_price: flight?.base_price ?? 100,
    region_shard: flight?.region_shard || 'lahore',
    seat_class: 'economy',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        departure_airport: form.departure_airport.toUpperCase(),
        arrival_airport: form.arrival_airport.toUpperCase(),
        base_price: parseFloat(form.base_price),
        scheduled_departure: new Date(form.scheduled_departure).toISOString(),
        scheduled_arrival: new Date(form.scheduled_arrival).toISOString(),
      };
      if (isEdit) {
        // Reschedules/edits don't touch seat inventory or the flight number, so only send the editable fields.
        await updateFlight(flight.flight_id, {
          aircraft_id: payload.aircraft_id,
          departure_airport: payload.departure_airport,
          arrival_airport: payload.arrival_airport,
          scheduled_departure: payload.scheduled_departure,
          scheduled_arrival: payload.scheduled_arrival,
          base_price: payload.base_price,
          region_shard: payload.region_shard,
        });
        onDone('Flight updated successfully.');
      } else {
        await createFlight(payload);
        onDone('Flight scheduled successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1C2B22]/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#1C2B22] border border-[#0A6B41] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-[#1C2B22]/50 hover:bg-[#1C2B22] rounded-full transition-colors">
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#1C2B22]/50 border border-[#0A6B41] flex items-center justify-center text-[#A89411] shrink-0">
            <Plane size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">{isEdit ? 'Edit Flight' : 'Schedule Flight'}</h3>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
              {isEdit ? 'Update existing flight parameters' : 'Create new route operation'}
            </p>
          </div>
        </div>

        {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl font-bold text-xs border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <Field label="Flight Number">
              <input required value={form.flight_number} onChange={set('flight_number')} placeholder="PK1234"
                className="w-full bg-[#1C2B22] border border-[#0A6B41] rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 outline-none focus:border-[#A89411] transition-colors" />
            </Field>
          )}

          <Field label="Aircraft">
            <select required value={form.aircraft_id} onChange={set('aircraft_id')}
              className="w-full bg-[#1C2B22] border border-[#0A6B41] rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 outline-none focus:border-[#A89411] transition-colors">
              {aircraftOptions.map(a => (
                <option key={a.aircraft_id} value={a.aircraft_id}>{a.registration_code} — {a.model}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Departure Airport">
              <input required maxLength={3} value={form.departure_airport} onChange={set('departure_airport')} placeholder="LHE"
                className="w-full bg-[#1C2B22] border border-[#0A6B41] rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 uppercase outline-none focus:border-[#A89411] transition-colors" />
            </Field>
            <Field label="Arrival Airport">
              <input required maxLength={3} value={form.arrival_airport} onChange={set('arrival_airport')} placeholder="KHI"
                className="w-full bg-[#1C2B22] border border-[#0A6B41] rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 uppercase outline-none focus:border-[#A89411] transition-colors" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Departure Time">
              <input required type="datetime-local" value={form.scheduled_departure} onChange={set('scheduled_departure')}
                className="w-full bg-[#1C2B22] border border-[#0A6B41] rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 outline-none focus:border-[#A89411] transition-colors" />
            </Field>
            <Field label="Arrival Time">
              <input required type="datetime-local" value={form.scheduled_arrival} onChange={set('scheduled_arrival')}
                className="w-full bg-[#1C2B22] border border-[#0A6B41] rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 outline-none focus:border-[#A89411] transition-colors" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Base Price (USD)">
              <input required type="number" min="1" step="1" value={form.base_price} onChange={set('base_price')}
                className="w-full bg-[#1C2B22] border border-[#0A6B41] rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 outline-none focus:border-[#A89411] transition-colors" />
            </Field>
            {!isEdit && (
              <Field label="Seat Class">
                <select value={form.seat_class} onChange={set('seat_class')}
                  className="w-full bg-[#1C2B22] border border-[#0A6B41] rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 outline-none focus:border-[#A89411] transition-colors">
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="first">First</option>
                </select>
              </Field>
            )}
          </div>

          <button
            disabled={submitting}
            type="submit"
            className="w-full bg-[#A89411] hover:bg-[#D4C345] disabled:bg-[#1C2B22] disabled:text-white/30 text-[#1C2B22] font-black py-4 rounded-xl transition-all shadow-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {submitting ? 'Processing...' : isEdit ? 'Save Changes' : 'Schedule Flight'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">{label}</label>
      {children}
    </div>
  );
}
