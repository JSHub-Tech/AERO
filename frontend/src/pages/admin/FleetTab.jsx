import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { getFleetAdmin, retireAircraft } from '../../services/api';
import { SearchBox, Pagination, StatusBadge, ConfirmModal } from './shared';
import AircraftFormModal from './AircraftFormModal';

const PAGE_SIZE = 10;

export default function FleetTab() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');

  const [formTarget, setFormTarget] = useState(null); // null | 'new' | aircraft object
  const [retireTarget, setRetireTarget] = useState(null);
  const [retiring, setRetiring] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setAircraft(await getFleetAdmin());
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

  const handleRetire = async () => {
    if (!retireTarget) return;
    setRetiring(true);
    try {
      await retireAircraft(retireTarget.aircraft_id);
      setRetireTarget(null);
      flash(`${retireTarget.registration_code} retired.`);
      load();
    } catch (err) {
      alert('Failed to retire aircraft: ' + (err.response?.data?.detail || err.message));
    } finally {
      setRetiring(false);
    }
  };

  const filtered = aircraft.filter(a =>
    a.registration_code.toLowerCase().includes(search.toLowerCase()) ||
    a.model.toLowerCase().includes(search.toLowerCase()) ||
    a.manufacturer.toLowerCase().includes(search.toLowerCase())
  );
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
          <h2 className="text-sm font-black tracking-widest uppercase text-gray-400">Fleet</h2>
          <div className="flex items-center gap-3">
            <SearchBox value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search aircraft..." />
            <button
              onClick={() => setFormTarget('new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#004F30] hover:bg-[#003d25] text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors"
            >
              <Plus size={14} /> Add Aircraft
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
              <tr>
                <th className="p-4">Registration</th>
                <th className="p-4">Manufacturer</th>
                <th className="p-4">Model</th>
                <th className="p-4">Seats</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400 font-bold">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400 font-bold">No aircraft found.</td></tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a.aircraft_id} className="hover:bg-gray-50">
                    <td className="p-4 font-black text-[#1C2B22]">{a.registration_code}</td>
                    <td className="p-4 font-bold text-gray-600">{a.manufacturer}</td>
                    <td className="p-4 font-bold text-gray-600">{a.model}</td>
                    <td className="p-4 font-bold text-gray-500">{a.total_seats}</td>
                    <td className="p-4"><StatusBadge status={a.status} /></td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setFormTarget(a)}
                          title="Edit aircraft"
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          disabled={a.status === 'retired'}
                          onClick={() => setRetireTarget(a)}
                          title="Retire aircraft"
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

      {formTarget && (
        <AircraftFormModal
          aircraft={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onDone={(msg) => { setFormTarget(null); flash(msg); load(); }}
        />
      )}

      {retireTarget && (
        <ConfirmModal
          title="Retire Aircraft"
          description={`${retireTarget.registration_code} — its flights are unaffected`}
          confirmLabel="Confirm Retirement"
          busy={retiring}
          onConfirm={handleRetire}
          onClose={() => setRetireTarget(null)}
        />
      )}
    </div>
  );
}
