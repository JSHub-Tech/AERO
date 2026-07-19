import { useState } from 'react';
import { X, Plane } from 'lucide-react';
import { createAircraft, updateAircraft } from '../../services/api';

export default function AircraftFormModal({ aircraft, onClose, onDone }) {
  const isEdit = Boolean(aircraft);
  const [form, setForm] = useState({
    registration_code: aircraft?.registration_code || '',
    manufacturer: aircraft?.manufacturer || '',
    model: aircraft?.model || '',
    total_seats: aircraft?.total_seats ?? 150,
    status: aircraft?.status || 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        // registration_code is immutable once created — send everything else.
        await updateAircraft(aircraft.aircraft_id, {
          manufacturer: form.manufacturer,
          model: form.model,
          total_seats: parseInt(form.total_seats),
          status: form.status,
        });
        onDone('Aircraft updated successfully.');
      } else {
        await createAircraft({ ...form, total_seats: parseInt(form.total_seats) });
        onDone('Aircraft added to fleet.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1C2B22]/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full">
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#004F30]/10 flex items-center justify-center text-[#004F30]">
            <Plane size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1C2B22] tracking-tight">{isEdit ? 'Edit Aircraft' : 'Add Aircraft'}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{isEdit ? aircraft.registration_code : 'New Fleet Entry'}</p>
          </div>
        </div>

        {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl font-bold text-xs border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Registration Code">
            <input required disabled={isEdit} value={form.registration_code} onChange={set('registration_code')} placeholder="AP-BOB"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1C2B22] outline-none focus:border-[#004F30] disabled:opacity-60" />
          </Field>
          <Field label="Manufacturer">
            <input required value={form.manufacturer} onChange={set('manufacturer')} placeholder="Airbus"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1C2B22] outline-none focus:border-[#004F30]" />
          </Field>
          <Field label="Model">
            <input required value={form.model} onChange={set('model')} placeholder="Airbus A320-200"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1C2B22] outline-none focus:border-[#004F30]" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Total Seats">
              <input required type="number" min="1" value={form.total_seats} onChange={set('total_seats')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1C2B22] outline-none focus:border-[#004F30]" />
            </Field>
            {isEdit && (
              <Field label="Status">
                <select value={form.status} onChange={set('status')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1C2B22] outline-none focus:border-[#004F30]">
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </Field>
            )}
          </div>

          <button disabled={submitting} type="submit"
            className="w-full bg-[#004F30] hover:bg-[#003d25] disabled:bg-gray-400 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-[#004F30]/20 text-xs uppercase tracking-widest">
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Aircraft'}
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
