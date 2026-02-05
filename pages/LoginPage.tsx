
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, ChefHat, Users, ShieldCheck, Activity, 
  Fingerprint, Sparkles, Mail, ArrowLeft, MailOpen, UserPlus, Phone, Star,
  Facebook, AlertCircle, LogIn, Eye, EyeOff, Database, ArrowRight, Key, ZapOff
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { MOCK_ADMIN, MOCK_USER } from '../constants';
import { supabase } from '../supabase';

const LoginPage: React.FC<{ setCurrentUser: (u: UserType) => void }> = ({ setCurrentUser }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'RESET'>('LOGIN');
  const [userType, setUserType] = useState<'PATRON' | 'ADMIN'>('PATRON');
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSchemaError, setIsSchemaError] = useState(false);
  const [isRecursionError, setIsRecursionError] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setIsRegistered(false);
    setIsSchemaError(false);
    setIsRecursionError(false);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // --- BOUTIQUE ENTRY BYPASS FOR DEMO CREDENTIALS ---
    if (trimmedEmail === 'admin@deshi.com' && trimmedPassword === 'admin') {
      enterAsAdmin();
      return;
    }

    try {
      if (authMode === 'LOGIN') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword
        });
        
        if (authError) {
          if (authError.message.toLowerCase().includes('email not confirmed')) {
            throw new Error("Your identity has been recorded, but your email needs verification. Please check your inbox.");
          }
          throw authError;
        }
      } else if (authMode === 'SIGNUP') {
        if (!fullName.trim()) throw new Error("Please enter your full name for the boutique ledger.");
        
        const { data, error: authError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim()
            }
          }
        });
        
        if (authError) throw authError;

        if (!data.session) {
           alert("Success! Your boutique identity has been recorded. Please verify your email to unlock access.");
           setAuthMode('LOGIN');
        }
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      let msg = err.message || "An unauthorized interruption occurred.";
      
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes("already registered")) {
        msg = "This email is already part of our boutique circle.";
        setIsRegistered(true);
      } else if (lowerMsg.includes("invalid login credentials")) {
        msg = "Credentials mismatch. Please verify your email or use the Chef's Master Key.";
      } else if (lowerMsg.includes("infinite recursion")) {
        msg = "Supabase RLS Policy Loop detected. This happens when policies reference themselves indefinitely.";
        setIsRecursionError(true);
      } else if (lowerMsg.includes("schema") || lowerMsg.includes("relation") || (err as any).code === '42P01') {
        msg = "Database synchronization error. The Supabase SQL setup appears incomplete.";
        setIsSchemaError(true);
      }
      
      setError(msg);
      setPassword(''); 
    } finally {
      setIsLoading(false);
    }
  };

  const enterAsAdmin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentUser(MOCK_ADMIN);
      localStorage.setItem('dh_user', JSON.stringify(MOCK_ADMIN));
      setIsLoading(false);
      navigate('/admin');
    }, 800);
  };

  const handleBypass = () => {
    setCurrentUser(MOCK_USER);
    localStorage.setItem('dh_user', JSON.stringify(MOCK_USER));
    navigate('/account');
  };

  const switchMode = (mode: 'LOGIN' | 'SIGNUP' | 'RESET') => {
    setAuthMode(mode);
    setShowPassword(false);
    setError('');
    setIsRegistered(false);
    setIsSchemaError(false);
    setIsRecursionError(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-slate-950 transition-colors duration-500">
      <div className="max-w-md w-full">
        
        {authMode === 'LOGIN' && (
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[2rem] mb-10 border border-slate-200 dark:border-slate-800 shadow-inner animate-in fade-in duration-500">
            <button 
              onClick={() => { setUserType('PATRON'); setError(''); setIsRegistered(false); setShowPassword(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${userType === 'PATRON' ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-xl' : 'text-slate-500'}`}
            >
              <Users className="w-4 h-4" /> Patron Entry
            </button>
            <button 
              onClick={() => { setUserType('ADMIN'); setError(''); setIsRegistered(false); setShowPassword(false); }}
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
                  {userType === 'ADMIN' ? 'Chef Identity' : 'Authorized Access'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">
                  {userType === 'ADMIN' ? 'Secure Operations Login' : 'Patron Portfolio Entry'}
                </p>
              </div>

              {error && (
                <div className={`mb-8 p-6 rounded-3xl border flex flex-col gap-4 animate-in shake duration-300 ${isSchemaError || isRecursionError ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50'}`}>
                  <div className="flex items-start gap-4">
                    {isRecursionError ? <ZapOff className="w-6 h-6 text-rose-600 shrink-0" /> : isSchemaError ? <Database className="w-6 h-6 text-amber-600 shrink-0" /> : <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />}
                    <div className="flex-grow">
                      <p className={`text-[12px] font-black uppercase tracking-widest mb-1 ${isSchemaError || isRecursionError ? 'text-amber-800 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {isRecursionError ? 'Policy Conflict' : isSchemaError ? 'Schema Error' : 'Entry Denied'}
                      </p>
                      <p className={`text-[12px] font-medium leading-relaxed ${isSchemaError || isRecursionError ? 'text-amber-700 dark:text-amber-500' : 'text-rose-600 dark:text-rose-500'}`}>{error}</p>
                    </div>
                  </div>
                  {(isSchemaError || isRecursionError) && (
                    <div className="space-y-3">
                       {isRecursionError && (
                          <div className="p-3 bg-white/50 dark:bg-slate-950/50 rounded-xl border border-rose-200 dark:border-rose-900 text-[9px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed">
                            FIX: Run the SQL Editor command to replace recursive policies with a 'SECURITY DEFINER' function.
                          </div>
                       )}
                       <button 
                        onClick={handleBypass}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 hover:bg-amber-50 transition-all shadow-sm group"
                      >
                        Bypass to Artisanal Demo Mode <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {userType === 'ADMIN' && !error && (
                <button 
                  onClick={enterAsAdmin}
                  className="w-full mb-8 py-4.5 bg-amber-600/10 border border-amber-600/30 text-amber-700 dark:text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-amber-600/20 transition-all group"
                >
                  <Key className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Use Chef's Master Key
                </button>
              )}

              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      placeholder={userType === 'ADMIN' ? "admin@deshi.com" : "patron@deshi.com"}
                      className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-700/10 outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end mb-1 px-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Secret Key</label>
                    <button 
                      type="button"
                      onClick={() => switchMode('RESET')}
                      className="text-[9px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest hover:underline"
                    >
                      Recovery?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password} 
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-14 py-4.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-700/10 outline-none transition-all"
                      required 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  disabled={isLoading}
                  className={`w-full py-5 rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 ${userType === 'ADMIN' ? 'bg-slate-950 text-white' : 'bg-emerald-800 text-white hover:bg-emerald-900'}`}
                >
                  {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
                  {isLoading ? 'Verifying...' : 'Unlock Account'}
                </button>
              </form>

              {userType === 'PATRON' && (
                <div className="mt-10 pt-10 border-t border-slate-50 dark:border-slate-800 text-center">
                  <button 
                    onClick={() => switchMode('SIGNUP')}
                    className="text-emerald-800 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-4 h-4" /> Create Artisan Portfolio
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
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">Join our culinary circle</p>
              </div>

              {error && (
                <div className={`mb-8 p-6 rounded-3xl border flex flex-col gap-4 animate-in fade-in zoom-in duration-300 ${isRegistered ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/50' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50'}`}>
                  <div className="flex items-start gap-4">
                    {isRegistered ? <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />}
                    <div className="flex-grow">
                      <p className={`text-[12px] font-black uppercase tracking-widest mb-1 ${isRegistered ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {isRegistered ? 'Identity Recognized' : 'Registration Alert'}
                      </p>
                      <p className={`text-[12px] font-medium leading-relaxed ${isRegistered ? 'text-emerald-700 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>{error}</p>
                    </div>
                  </div>
                  {(isRegistered || isSchemaError || isRecursionError) && (
                    <button 
                      onClick={isRegistered ? () => switchMode('LOGIN') : handleBypass}
                      className="w-full py-4 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors shadow-sm"
                    >
                      {isRegistered ? <><LogIn className="w-4 h-4" /> Go to Login Protocol</> : <><Database className="w-4 h-4" /> Enter Demo Mode</>}
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Artisan Patron"
                      className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-700/10 outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="mb-1 px-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secure Email</label>
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      placeholder="patron@deshi.com"
                      className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-700/10 outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-14 pr-14 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-700/10 outline-none transition-all"
                      required 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  disabled={isLoading}
                  className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 hover:bg-emerald-900 mt-4"
                >
                  {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isLoading ? 'Processing...' : 'Register Portfolio'}
                </button>

                <button 
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors mt-6"
                >
                  <ArrowLeft className="w-3 h-3" /> Already a member? Log In
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
