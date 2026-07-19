import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { Plane, Lock, Mail, ArrowRight, AlertTriangle, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

// Shared little pieces so the three forms below stay visually identical
// without sharing any state.
function FieldLabel({ children }) {
  return <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">{children}</label>;
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-8 p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
      <AlertTriangle size={18} className="shrink-0" />
      {message}
    </div>
  );
}

function EmailField({ value, onChange, placeholder = 'passenger@aero.com' }) {
  return (
    <div>
      <FieldLabel>Email Address</FieldLabel>
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

// --- Sign In: entirely its own state, never touched by the other two forms ---
function LoginForm({ onForgotPassword }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const res = await login(email, password);

    if (!res.success) {
      setError(res.error || 'Authentication failed. Please check your credentials.');
      setIsSubmitting(false);
      return;
    }
    const redirectParams = new URLSearchParams(location.search);
    navigate(redirectParams.get('redirect') || '/');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ErrorBanner message={error} />
      <EmailField value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordField
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        show={showPassword}
        onToggleShow={() => setShowPassword((v) => !v)}
        autoComplete="current-password"
      />

      <button type="button" onClick={onForgotPassword} className="text-left -mt-2 text-[11px] font-black text-[#004F30] hover:text-[#1C2B22] uppercase tracking-widest transition-colors">
        Forgot password?
      </button>

      <button disabled={isSubmitting} type="submit" className="mt-2 w-full bg-gradient-to-r from-[#004F30] to-[#0A6B41] hover:from-[#1C2B22] hover:to-[#1C2B22] disabled:from-gray-400 disabled:to-gray-400 text-white font-black py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-[#004F30]/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2 group hover:-translate-y-0.5 hover:shadow-2xl">
        {isSubmitting ? 'Authenticating...' : 'Authenticate'}
        {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
      </button>
    </form>
  );
}

// --- Create Account: entirely its own state ---
function RegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter them.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await signup(email, password);

    if (!res.success) {
      setError(res.error || 'Account creation failed. Please try again.');
      setIsSubmitting(false);
      return;
    }
    const redirectParams = new URLSearchParams(location.search);
    navigate(redirectParams.get('redirect') || '/');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ErrorBanner message={error} />
      <EmailField value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordField
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        show={showPassword}
        onToggleShow={() => setShowPassword((v) => !v)}
        autoComplete="new-password"
      />
      <div className="animate-fade-in-up">
        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          show={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword((v) => !v)}
          autoComplete="new-password"
        />
      </div>

      <button disabled={isSubmitting} type="submit" className="mt-6 w-full bg-gradient-to-r from-[#004F30] to-[#0A6B41] hover:from-[#1C2B22] hover:to-[#1C2B22] disabled:from-gray-400 disabled:to-gray-400 text-white font-black py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-[#004F30]/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2 group hover:-translate-y-0.5 hover:shadow-2xl">
        {isSubmitting ? 'Creating Account...' : 'Register Account'}
        {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
      </button>
    </form>
  );
}

// --- Reset Password: entirely its own state ---
function ResetPasswordForm({ onBackToLogin }) {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter them.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await resetPassword(email, newPassword);

    if (!res.success) {
      setError(res.error || 'Password reset failed. Please try again.');
      setIsSubmitting(false);
      return;
    }
    setSuccess(true);
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <CheckCircle2 size={32} />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#1C2B22] tracking-tight mb-2">Password Updated</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Sign in with your new password to continue.
          </p>
        </div>
        <button
          onClick={onBackToLogin}
          className="w-full bg-[#004F30] hover:bg-[#1C2B22] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[#004F30]/20 text-xs uppercase tracking-widest"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ErrorBanner message={error} />
      <p className="text-xs font-bold text-gray-400 -mt-2 leading-relaxed">
        Enter the email on your account and choose a new password.
      </p>
      <EmailField value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordField
        label="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        show={showPassword}
        onToggleShow={() => setShowPassword((v) => !v)}
        autoComplete="new-password"
      />
      <PasswordField
        label="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        show={showConfirmPassword}
        onToggleShow={() => setShowConfirmPassword((v) => !v)}
        autoComplete="new-password"
      />

      <button disabled={isSubmitting} type="submit" className="mt-2 w-full bg-gradient-to-r from-[#004F30] to-[#0A6B41] hover:from-[#1C2B22] hover:to-[#1C2B22] disabled:from-gray-400 disabled:to-gray-400 text-white font-black py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-[#004F30]/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2 group hover:-translate-y-0.5 hover:shadow-2xl">
        {isSubmitting ? 'Updating Password...' : 'Reset Password'}
        {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
      </button>

      <button type="button" onClick={onBackToLogin} className="text-center text-[11px] font-black text-gray-400 hover:text-[#004F30] uppercase tracking-widest transition-colors">
        Back to Sign In
      </button>
    </form>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'reset'

  // If already logged in, show a nice profile summary instead of the login form
  if (user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col pt-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,79,48,0.05)_0%,_transparent_50%)] z-0 pointer-events-none"></div>
        <div className="flex-grow flex items-center justify-center px-6 relative z-10 pb-20">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10 max-w-lg w-full text-center animate-fade-in-up hover-lift">
            <div className="w-20 h-20 bg-gradient-to-br from-[#004F30] to-[#A89411] rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-[#004F30]/20 animate-pulse-glow">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-3xl font-black text-[#1C2B22] tracking-tighter mb-2">ACCESS GRANTED</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">
              Authenticated as {user.email}
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => navigate('/booking')}
                className="w-full bg-[#004F30] hover:bg-[#1C2B22] text-white font-black py-4 rounded-xl transition-all duration-300 shadow-lg shadow-[#004F30]/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Continue to Booking <ArrowRight size={16} />
              </button>
              {user.role === 'admin' && (
                <button 
                  onClick={() => navigate('/command-center')}
                  className="w-full bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-black py-4 rounded-xl transition-all duration-300 text-xs uppercase tracking-widest border border-red-100 hover:-translate-y-0.5"
                >
                  Enter Command Center
                </button>
              )}
              <button
                onClick={() => navigate('/account')}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-black py-4 rounded-xl transition-all text-xs uppercase tracking-widest border border-gray-100"
              >
                Account Settings
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col pt-[100px] overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,148,17,0.05)_0%,_transparent_70%)] z-0 pointer-events-none"></div>
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-gradient-to-br from-[#004F30]/10 to-[#A89411]/10 rounded-full blur-[100px] -z-0 pointer-events-none animate-float"></div>
      
      <div className="flex-grow flex items-center justify-center px-6 relative z-10 pb-20">
        
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100 animate-fade-in-up">
          
          {/* Left Side: Cinematic Branding */}
          <div className="hidden md:flex flex-col justify-between bg-[#1C2B22] p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            {/* Golden + Green gradient glows for brand depth */}
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-[#004F30] to-[#A89411] rounded-full blur-[100px] opacity-40 animate-float"></div>
            <div className="absolute -top-24 -left-16 w-72 h-72 bg-gradient-to-tr from-[#A89411] to-[#004F30] rounded-full blur-[100px] opacity-20"></div>
            
            <div className="relative z-10">
              <img src="/logo.png" alt="AERO" className="h-12 w-auto mb-6 brightness-0 invert" />
              <h1 className="text-5xl font-black tracking-tighter leading-none mb-4">AERO<br/>GLOBAL<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7FE0B0] to-[#F0D97A]">NETWORK</span>
              </h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest max-w-[250px] leading-relaxed">
                Secure access portal for global flight reservations and administrative control.
              </p>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="p-10 md:p-14 flex flex-col justify-center">
            
            <div className="mb-10 flex items-center justify-center md:hidden">
              <Plane size={32} className="text-[#004F30] transform -rotate-45 mr-3" />
              <span className="text-2xl font-black text-[#1C2B22] tracking-tighter">AERO</span>
            </div>

            {authMode === 'reset' ? (
              <div className="mb-10">
                <h2 className="text-xl font-black text-[#1C2B22] tracking-tight">Reset Password</h2>
              </div>
            ) : (
              <div className="flex border-b border-gray-100 mb-10">
                <button 
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 pb-4 text-xs font-black tracking-widest uppercase transition-all duration-300 ${authMode === 'login' ? 'text-[#004F30] border-b-2 border-[#004F30]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 pb-4 text-xs font-black tracking-widest uppercase transition-all duration-300 ${authMode === 'register' ? 'text-[#004F30] border-b-2 border-[#004F30]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Each mode is a fully separate component with its own state —
                switching tabs can never carry a value from one form into the other. */}
            {authMode === 'login' && <LoginForm onForgotPassword={() => setAuthMode('reset')} />}
            {authMode === 'register' && <RegisterForm />}
            {authMode === 'reset' && <ResetPasswordForm onBackToLogin={() => setAuthMode('login')} />}

            <div className="text-center mt-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Secure Identity Protocol v2.0
              </p>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}