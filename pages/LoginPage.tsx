
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, ChefHat, Users, ShieldCheck, Activity, 
  Fingerprint, Sparkles, Mail, ArrowLeft, MailOpen, UserPlus, Phone, Star
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { MOCK_ADMIN } from '../constants';
import { supabase } from '../supabase';

const LoginPage: React.FC<{ setCurrentUser: (u: UserType) => void }> = ({ setCurrentUser }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'RESET'>('LOGIN');
  const [userType, setUserType] = useState<'PATRON' | 'ADMIN'>('PATRON');
  const navigate = useNavigate();
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // --- BOUTIQUE ENTRY BYPASS FOR DEMO CREDENTIALS ---
    if (email === 'admin@deshi.com' && password === 'admin') {
      setTimeout(() => {
        setCurrentUser(MOCK_ADMIN);
        localStorage.setItem('dh_user', JSON.stringify(MOCK_ADMIN));
        setIsLoading(false);
        navigate('/admin');
      }, 800);
      return;
    }

    try {
      if (authMode === 'LOGIN') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (authError) throw authError;
      } else if (authMode === 'SIGNUP') {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone
            }
          }
        });
        if (authError) throw authError;
        alert("Success! Account created. If verification is enabled, check your email. Otherwise, you may now log in.");
        setAuthMode('LOGIN');
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email);
      if (resetErr) throw resetErr;
      setResetSuccess(true);
      setTimeout(() => setAuthMode('LOGIN'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const prefillAdmin = () => {
    setUserType('ADMIN');
    setEmail('admin@deshi.com');
    setPassword('admin');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-slate-950 transition-colors duration-500">
      <div className="max-w-md w-full">
        
        {authMode === 'LOGIN' && (
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[2rem] mb-10 border border-slate-200 dark:border-slate-800 shadow-inner animate-in fade-in duration-500">
            <button 
              onClick={() => { setUserType('PATRON'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${userType === 'PATRON' ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-xl' : 'text-slate-500'}`}
            >
              <Users className="w-4 h-4" /> Patron Entry
            </button>
            <button 
              onClick={() => { setUserType('ADMIN'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${userType === 'ADMIN' ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-500 shadow-xl' : 'text-slate-500'}`}
            >
              <ChefHat className="w-4 h-4" /> Head Chef
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-50 dark:border-slate-800 relative overflow-hidden transition-all duration-500">
          
          {authMode === 'LOGIN' && (
            <>
              <div className="text-center mb-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors ${userType === 'ADMIN' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400'}`}>
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {userType === 'ADMIN' ? 'Chef Authorization' : 'Authorized Entry'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">
                  {userType === 'ADMIN' ? 'Kitchen Management Portal' : 'Boutique Portfolio Access'}
                </p>
              </div>

              {error && <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900 animate-pulse">{error}</div>}

              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      placeholder="patron@deshi.com"
                      className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end mb-1 px-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Secret Key</label>
                    <button 
                      type="button"
                      onClick={() => setAuthMode('RESET')}
                      className="text-[9px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                <button 
                  disabled={isLoading}
                  className={`w-full py-5 rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 ${userType === 'ADMIN' ? 'bg-slate-900 dark:bg-amber-700 text-white' : 'bg-emerald-800 text-white hover:bg-emerald-900'}`}
                >
                  {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
                  {isLoading ? 'Verifying...' : 'Unlock Entry'}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
                 <button 
                  onClick={prefillAdmin}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900 hover:bg-amber-100 transition-all"
                 >
                   <Star className="w-3 h-3 fill-amber-700" /> Quick Entry: Admin@Deshi.com
                 </button>
              </div>

              {userType === 'PATRON' && (
                <div className="mt-10 animate-in slide-in-from-bottom-2 duration-500 text-center">
                  <button 
                    onClick={() => setAuthMode('SIGNUP')}
                    className="text-emerald-800 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:gap-3 transition-all"
                  >
                    <Sparkles className="w-3 h-3" /> Create New Portfolio
                  </button>
                </div>
              )}
            </>
          )}

          {authMode === 'SIGNUP' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
               <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Patron</h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">Join the artisanal boutique</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Sameer Khan"
                      className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="patron@deshi.com"
                      className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1..."
                      className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                <button 
                  disabled={isLoading}
                  className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 hover:bg-emerald-900 mt-4"
                >
                  {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isLoading ? 'Creating Portfolio...' : 'Authorized Signup'}
                </button>

                <button 
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors mt-4"
                >
                  <ArrowLeft className="w-3 h-3" /> Already a Patron? Log In
                </button>
              </form>
            </div>
          )}

          {authMode === 'RESET' && (
            <div className="animate-in zoom-in-95 duration-300">
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6">
                  {resetSuccess ? <MailOpen className="w-8 h-8 animate-bounce" /> : <Mail className="w-8 h-8" />}
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Recovery Mode</h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">Secure Link Dispatch</p>
              </div>

              {resetSuccess ? (
                <div className="text-center py-6 animate-in fade-in duration-500">
                  <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900">
                    Transmission Successful. Check your inbox.
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    Redirecting to Boutique entry...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Registered Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                      <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        placeholder="patron@boutique.com"
                        className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 outline-none transition-all"
                        required 
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isLoading}
                    className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 hover:bg-emerald-900"
                  >
                    {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isLoading ? 'Dispatching...' : 'Request Link'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setAuthMode('LOGIN')}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Entry
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
