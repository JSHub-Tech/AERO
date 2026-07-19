import { useEffect, useState } from 'react';
import { ShieldOff, ShieldCheck, UserCog } from 'lucide-react';
import { getUsers, updateUserRole, updateUserStatus } from '../../services/api';
import { SearchBox, Pagination, StatusBadge, ConfirmModal } from './shared';

const PAGE_SIZE = 10;

export default function UsersTab({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [statusTarget, setStatusTarget] = useState(null); // { user, nextActive }
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
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

  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRole(user.user_id, nextRole);
      flash(`${user.email} is now ${nextRole}.`);
      load();
    } catch (err) {
      alert('Failed to change role: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleConfirmStatus = async () => {
    if (!statusTarget) return;
    setBusy(true);
    try {
      await updateUserStatus(statusTarget.user.user_id, statusTarget.nextActive);
      flash(`${statusTarget.user.email} ${statusTarget.nextActive ? 'reactivated' : 'deactivated'}.`);
      setStatusTarget(null);
      load();
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.detail || err.message));
    } finally {
      setBusy(false);
    }
  };

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl font-bold text-sm border border-green-200">{successMsg}</div>
      )}

      <div className="bg-[#004F30] rounded-3xl shadow-[0_20px_60px_rgba(0,79,48,0.3)] border border-[#0A6B41] overflow-hidden">
        <div className="p-6 border-b border-[#0A6B41] flex flex-wrap gap-4 items-center justify-between bg-[#1C2B22]/30">
          <h2 className="text-sm font-black tracking-widest uppercase text-white/50">Users</h2>
          <SearchBox value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by email..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1C2B22]/50 text-[10px] uppercase font-black tracking-widest text-white/50">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A6B41]">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-white/50 font-bold">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-white/50 font-bold">No users found.</td></tr>
              ) : (
                paginated.map((u) => {
                  const isSelf = u.user_id === currentUserId;
                  return (
                    <tr key={u.user_id} className="hover:bg-[#1C2B22]/30 transition-colors">
                      <td className="p-4 font-black text-white">{u.email}{isSelf && <span className="text-[#A89411] font-bold"> (you)</span>}</td>
                      <td className="p-4"><StatusBadge status={u.role} /></td>
                      <td className="p-4"><StatusBadge status={u.is_active ? 'active' : 'retired'} /></td>
                      <td className="p-4 font-bold text-white/60">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleRole(u)}
                            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                            className="p-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <UserCog size={14} />
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() => setStatusTarget({ user: u, nextActive: !u.is_active })}
                            title={u.is_active ? 'Deactivate account' : 'Reactivate account'}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none ${u.is_active ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                          >
                            {u.is_active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
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

      {statusTarget && (
        <ConfirmModal
          title={statusTarget.nextActive ? 'Reactivate Account' : 'Deactivate Account'}
          description={statusTarget.user.email}
          confirmLabel={statusTarget.nextActive ? 'Confirm Reactivation' : 'Confirm Deactivation'}
          busy={busy}
          onConfirm={handleConfirmStatus}
          onClose={() => setStatusTarget(null)}
        />
      )}
    </div>
  );
}
