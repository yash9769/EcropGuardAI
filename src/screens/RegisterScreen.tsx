import React, { useState } from 'react';
import { PottedPlant, Mail, Lock, CheckCircle, ChevronRight, Encrypted, Psychology } from '../components/Icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const RegisterScreen = ({ 
  onRegister, 
  onSwitchToLogin 
}: { 
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  onSwitchToLogin: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill all fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      await onRegister(formData.email, formData.password, formData.name);
      setShowSuccess(true);
    } catch (err) {
      setError('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-100/40 blur-[120px] -z-10 rounded-full -translate-y-1/2 -translate-x-1/4"></div>
      
      <motion.main 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[520px]"
      >
        <div className="bg-surface-container-lowest border border-emerald-900/5 rounded-[3rem] p-10 md:p-14 shadow-2xl">
          <AnimatePresence mode="wait">
            {!showSuccess ? (
              <motion.div
                key="register"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-secondary-container mb-6 shadow-lg shadow-emerald-900/5">
                    <Psychology className="text-on-secondary-container w-10 h-10" />
                  </div>
                  <h1 className="text-4xl font-headline font-black tracking-tight text-primary mb-2">Create Account</h1>
                  <p className="text-on-surface-variant font-medium leading-relaxed">Join the AgriSense AI network</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-[0.2em] text-outline-variant uppercase ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Alex Harrison"
                      className="w-full px-6 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-[0.2em] text-outline-variant uppercase ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="farmer@agrisense.ai"
                      className="w-full px-6 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-[0.2em] text-outline-variant uppercase ml-1">Password</label>
                      <input 
                        type="password" 
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full px-6 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-[0.2em] text-outline-variant uppercase ml-1">Confirm</label>
                      <input 
                        type="password" 
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="••••••••"
                        className="w-full px-6 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {error && <p className="text-error text-xs font-bold text-center">{error}</p>}

                  <button 
                    disabled={isLoading}
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Initialize Node</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
                  <p className="text-on-surface-variant font-medium">
                    Already have an account? 
                    <button 
                      onClick={onSwitchToLogin}
                      className="text-primary font-black ml-2 hover:underline underline-offset-4"
                    >
                      Sign In here
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
                <h2 className="text-3xl font-headline font-black text-primary">Account Created</h2>
                <p className="text-on-surface-variant font-medium mt-2">Your ecological workspace is ready.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-outline">
          <Encrypted className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Secure Data Processing Protocol</span>
        </div>
      </motion.main>
    </div>
  );
};

