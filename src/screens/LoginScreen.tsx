import React, { useState } from 'react';
import { PottedPlant, Mail, Lock, Visibility, Encrypted, CheckCircle, ChevronRight } from '../components/Icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const LoginScreen = ({ 
  onLogin, 
  onSwitchToRegister 
}: { 
  onLogin: (email: string, password: string) => Promise<void>;


  onSwitchToRegister: () => void;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Invalid credentials');
      return;
    }
    
    setIsLoading(true);
    setError('');

        try {
          await onLogin(email, password);
          setShowSuccess(true);
        } catch (err) {
          setError('Login failed');
        } finally {
          setIsLoading(false);
        }


  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Background elements to match the app */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/40 blur-[120px] -z-10 rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-800/5 blur-[100px] -z-10 rounded-full translate-y-1/4 -translate-x-1/4"></div>
      
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="bg-surface-container-lowest border border-emerald-900/5 rounded-[3rem] p-10 md:p-14 shadow-2xl">
          <AnimatePresence mode="wait">
            {!showSuccess ? (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-primary-container mb-6 shadow-lg shadow-emerald-900/10">
                    <PottedPlant className="text-white w-10 h-10" />
                  </div>
                  <h1 className="text-4xl font-headline font-black tracking-tight text-primary mb-2">Welcome Back</h1>
                  <p className="text-on-surface-variant font-medium leading-relaxed">Sign in to your AgriSense AI account</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-[0.2em] text-outline-variant uppercase ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agronomist@agrisense.ai"
                        className="w-full pl-14 pr-6 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-[0.2em] text-outline-variant uppercase ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-14 pr-14 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                      <button type="button" className="absolute inset-y-0 right-0 pr-5 flex items-center text-outline hover:text-primary">
                        <Visibility className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-error text-xs font-bold text-center">{error}</p>}

                  <button 
                    disabled={isLoading}
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
                  <p className="text-on-surface-variant font-medium">
                    New to AgriSense? 
                    <button 
                      onClick={onSwitchToRegister}
                      className="text-primary font-black ml-2 hover:underline underline-offset-4"
                    >
                      Create secure account
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-emerald-800 w-10 h-10" fill />
                </div>
                <h2 className="text-3xl font-headline font-black text-primary">Authenticated</h2>
                <p className="text-on-surface-variant font-medium mt-2">Preparing your field nodes...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-outline">
          <Encrypted className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted Link</span>
        </div>
      </motion.main>
    </div>
  );
};
