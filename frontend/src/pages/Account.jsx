import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { UserCircle2, Mail, Lock, ArrowRight, AlertTriangle, CheckCircle2, Eye, EyeOff, ShieldCheck, Lock as LockIcon } from 'lucide-react';

function FieldLabel({ children }) {
  return <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">{children}</label>;
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
      <AlertTriangle size={18} className="shrink-0" />
      {message}
    </div>
  );
}

function EmailField({ value, onChange, placeholder = 'new-email@aero.com' }) {
  return (
    <div>
      <FieldLabel>New Email Address</FieldLabel>
      <div className="relative">
        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="email"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-[#1C2B22] outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all placeholder:text-gray-400"
          required
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggleShow, autoComplete }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          autoComplete={autoComplete}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-14 pr-14 py-4 text-sm font-bold text-[#1C2B22] outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all placeholder:text-gray-400"
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004F30] transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

// --- Update Email panel: entirely its own state ---
function UpdateEmailPanel() {
  const { updateEmail } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    const res = await updateEmail(newEmail, currentPassword);

    if (!res.success) {
      setError(res.error || 'Email update failed. Please try again.');
      setIsSubmitting(false);
      return;
    }
    setSuccess(true);
    setNewEmail('');
    setCurrentPassword('');
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-[#004F30]/10 flex items-center justify-center text-[#004F30] shrink-0">
          <Mail size={22} />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#1C2B22] tracking-tight">Update Email Address</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Requires your current password</p>
        </div>
      </div>

      <ErrorBanner message={error} />
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-xs font-bold flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0" />
          Email updated successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <EmailField value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        <PasswordField
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          show={showPassword}
          onToggleShow={() => setShowPassword((v) => !v)}
          autoComplete="current-password"
        />

        <button
          disabled={isSubmitting}
          type="submit"
          className="w-full bg-gradient-to-r from-[#004F30] to-[#0A6B41] hover:from-[#1C2B22] hover:to-[#1C2B22] disabled:from-gray-400 disabled:to-gray-400 text-white font-black py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-[#004F30]/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2 group hover:-translate-y-0.5 hover:shadow-2xl"
        >
          {isSubmitting ? 'Saving...' : 'Save Email'}
          {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>
    </div>
  );
}

export default function Account() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1C2B22] flex items-center justify-center p-6 relative overflow-hidden mt-[80px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,79,48,0.2)_0%,_transparent_70%)]"></div>
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 p-10 rounded-3xl text-center max-w-md w-full relative z-10 shadow-2xl">
          <LockIcon size={56} className="mx-auto text-gray-400 mb-6" />
          <h1 className="text-2xl font-black text-white tracking-tighter mb-2">SIGN IN REQUIRED</h1>
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-8">
            Account settings are only available once you're signed in.
          </p>
          <button
            onClick={() => navigate('/login?redirect=/account')}
            className="w-full bg-[#004F30] hover:bg-[#0A6B41] text-white font-black tracking-widest text-xs uppercase py-4 rounded-xl transition-colors shadow-lg shadow-[#004F30]/20"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col pt-[100px]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,79,48,0.05)_0%,_transparent_50%)] z-0 pointer-events-none"></div>
      <div className="flex-grow px-6 relative z-10 pb-20">
        <div className="max-w-xl mx-auto w-full flex flex-col gap-6">

          <div className="mb-2">
            <h1 className="text-3xl font-black text-[#1C2B22] tracking-tighter flex items-center gap-3">
              <UserCircle2 className="text-[#004F30]" size={32} />
              ACCOUNT SETTINGS
            </h1>
            <p className="text-gray-500 font-bold text-sm tracking-widest mt-1 uppercase">Manage your AERO profile</p>
          </div>

          {/* Profile summary */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#004F30] to-[#A89411] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#004F30]/20">
              <ShieldCheck size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-[#1C2B22] tracking-tight truncate">{user.email}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                {user.role === 'admin' ? 'Administrator' : 'Passenger Account'}
              </p>
            </div>
          </div>

          <UpdateEmailPanel />

        </div>
      </div>
      <Footer />
    </div>
  );
}