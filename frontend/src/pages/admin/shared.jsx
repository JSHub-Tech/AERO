import { Search, X, AlertTriangle } from 'lucide-react';

// --- Small overview stat card used on the Overview tab ---
export function StatCard({ icon: Icon, label, value, accent = 'text-[#004F30]', bg = 'bg-[#004F30]/10' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/40 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={accent} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 truncate">{label}</p>
        <p className="text-xl font-black text-[#1C2B22] tracking-tight truncate">{value}</p>
      </div>
    </div>
  );
}

// --- Search input used at the top of each table ---
export function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-[#004F30]"
      />
    </div>
  );
}

// --- Prev/Next pagination footer ---
export function Pagination({ page, totalPages, onPrev, onNext, rangeLabel }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">{rangeLabel}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        <span className="text-xs font-bold text-gray-500 px-2">{page} / {totalPages}</span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// --- Colored status pill (scheduled/delayed/cancelled/active/maintenance/etc.) ---
const STATUS_COLORS = {
  scheduled: 'bg-blue-50 text-blue-600',
  boarding: 'bg-amber-50 text-amber-600',
  final_call: 'bg-amber-50 text-amber-600',
  airborne: 'bg-emerald-50 text-emerald-600',
  delayed: 'bg-orange-50 text-orange-600',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-600',
  active: 'bg-emerald-50 text-emerald-600',
  maintenance: 'bg-amber-50 text-amber-600',
  retired: 'bg-gray-100 text-gray-500',
  confirmed: 'bg-emerald-50 text-emerald-600',
  admin: 'bg-[#004F30]/10 text-[#004F30]',
  user: 'bg-gray-100 text-gray-500',
};

export function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-gray-100 text-gray-500';
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

// --- Reusable confirm-destructive-action modal (cancel flight, retire aircraft, etc.) ---
export function ConfirmModal({ title, description, confirmLabel = 'Confirm', busy, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1C2B22]/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full">
          <X size={16} />
        </button>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1C2B22] tracking-tight">{title}</h3>
            {description && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{description}</p>}
          </div>
        </div>
        <button
          disabled={busy}
          onClick={onConfirm}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 text-xs uppercase tracking-widest"
        >
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </div>
  );
}
