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

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
          <h2 className="text-sm font-black tracking-widest uppercase text-gray-400">Users</h2>
          <SearchBox value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by email..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-bold">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-bold">No users found.</td></tr>
              ) : (
                paginated.map((u) => {
                  const isSelf = u.user_id === currentUserId;
                  return (
                    <tr key={u.user_id} className="hover:bg-gray-50">
                      <td className="p-4 font-black text-[#1C2B22]">{u.email}{isSelf && <span className="text-gray-400 font-bold"> (you)</span>}</td>
                      <td className="p-4"><StatusBadge status={u.role} /></td>
                      <td className="p-4"><StatusBadge status={u.is_active ? 'active' : 'retired'} /></td>
                      <td className="p-4 font-bold text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleRole(u)}
                            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                            className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <UserCog size={14} />
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() => setStatusTarget({ user: u, nextActive: !u.is_active })}
                            title={u.is_active ? 'Deactivate account' : 'Reactivate account'}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
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
