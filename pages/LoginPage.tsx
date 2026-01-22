
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, ChefHat, Users, ShieldCheck, Activity, 
  Chrome, Facebook, Fingerprint, Sparkles, Mail, ArrowLeft, MailOpen
} from 'lucide-react';
import { MOCK_ADMIN, MOCK_USER } from '../constants';
import { User as UserType, UserRole } from '../types';

const LoginPage: React.FC<{ setCurrentUser: (u: UserType) => void }> = ({ setCurrentUser }) => {
  const [authMode, setAuthMode] = useState<'PATRON' | 'ADMIN'>('PATRON');
  const [isResetMode, setIsResetMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (authMode === 'ADMIN') {
        if (username === 'admin' && password === 'admin') {
          setCurrentUser(MOCK_ADMIN);
          navigate('/admin');
        } else {
          setError('Invalid Admin Credentials (admin/admin)');
        }
      } else {
        if (username === 'user' && password === 'user') {
          setCurrentUser(MOCK_USER);
          navigate('/');
        } else {
          setError('Invalid User Credentials (user/user)');
        }
      }
      setIsLoading(false);
    }, 800);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate sending a reset link
    setTimeout(() => {
      setResetSuccess(true);
      setIsLoading(false);
      // Auto-revert to login after 3 seconds
      setTimeout(() => {
        setIsResetMode(false);
        setResetSuccess(false);
        setResetEmail('');
      }, 3000);
    }, 1200);
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const socialUser: UserType = {
        id: `S-${Date.now()}`,
        name: `${provider} Patron`,
        email: `${provider.toLowerCase()}@boutique.com`,
        role: UserRole.CUSTOMER
      };
      setCurrentUser(socialUser);
      navigate('/');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-slate-950 transition-colors duration-500">
      <div className="max-w-md w-full">
        {!isResetMode && (
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[2rem] mb-10 border border-slate-200 dark:border-slate-800 shadow-inner animate-in fade-in duration-500">
            <button 
              onClick={() => { setAuthMode('PATRON'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${authMode === 'PATRON' ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-xl' : 'text-slate-500'}`}
            >
              <Users className="w-4 h-4" /> Patron Portal
            </button>
            <button 
              onClick={() => { setAuthMode('ADMIN'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${authMode === 'ADMIN' ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-500 shadow-xl' : 'text-slate-500'}`}
            >
              <ChefHat className="w-4 h-4" /> Kitchen Access
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-50 dark:border-slate-800 relative overflow-hidden transition-all duration-500">
          {!isResetMode ? (
            <>
              <div className="text-center mb-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors ${authMode === 'ADMIN' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400'}`}>
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Authorized Entry</h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">Boutique Portfolio Access</p>
              </div>

              {error && <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900 animate-pulse">{error}</div>}

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative group">
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="text" 
                      value={username} 
                      onChange={e => setUsername(e.target.value)}
                      placeholder={authMode === 'ADMIN' ? 'admin' : 'user'}
                      className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end mb-1 px-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Password</label>
                    <button 
                      type="button"
                      onClick={() => setIsResetMode(true)}
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
                  className={`w-full py-5 rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 ${authMode === 'ADMIN' ? 'bg-slate-900 dark:bg-amber-700 text-white' : 'bg-emerald-800 text-white hover:bg-emerald-900'}`}
                >
                  {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
                  {isLoading ? 'Verifying...' : 'Unlock Entry'}
                </button>
              </form>

              {authMode === 'PATRON' && (
                <div className="mt-10 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-grow bg-slate-100 dark:bg-slate-800"></div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Social Unlock</span>
                    <div className="h-px flex-grow bg-slate-100 dark:bg-slate-800"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleSocialLogin('Google')} className="py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 hover:border-emerald-600 transition-all active:scale-95">
                      <Chrome className="w-4 h-4 text-emerald-600" />
                      <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white">Google</span>
                    </button>
                    <button onClick={() => handleSocialLogin('Facebook')} className="py-4 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 shadow-lg">
                      <Facebook className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase">Facebook</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
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
                        value={resetEmail} 
                        onChange={e => setResetEmail(e.target.value)}
                        placeholder="patron@boutique.com"
                        className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 outline-none transition-all"
                        required 
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium px-1 mt-2">
                      We will dispatch a one-time secure link to authorize your new portfolio credentials.
                    </p>
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
                    onClick={() => setIsResetMode(false)}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Entry
                  </button>
                </form>
              )}
            </div>
          )}

          {!isResetMode && (
            <div className="mt-10 text-center">
               <button className="text-emerald-800 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:gap-3 transition-all">
                 <Sparkles className="w-3 h-3" /> Create New Portfolio
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
