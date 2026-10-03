import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BrandLogo } from '../../components/ui/BrandLogo.tsx';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginProps> = ({ onSuccess, onBackToStore }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signIn(email, password);

    if (!result.success) {
      setError(result.error || 'Authentication failed. Please check your credentials.');
      setLoading(false);
      return;
    }

    if (result.role !== 'admin' && result.role !== 'manager') {
      setError('Access Denied: Only Administrator or Manager roles can access this portal.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#3B2314] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Subtle brand watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-[0.03] pointer-events-none">
        <BrandLogo variant="monogram" size="xl" className="w-full h-full" color="#3B2314" />
      </div>

      {/* Top back bar */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onBackToStore}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFFDF9] hover:bg-[#F4EFE6] border border-[#D8CEC4] hover:border-[#3B2314] text-[#3B2314] text-xs font-serif uppercase tracking-widest transition-colors rounded-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Boutique</span>
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Full Brand Logo Presentation matching attached logo */}
        <div className="flex justify-center pb-2">
          <BrandLogo variant="full" size="md" color="#3B2314" showTagline={true} showUrdu={true} />
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury p-8 space-y-6 rounded-none">
          <div className="text-center space-y-1 border-b border-[#D8CEC4] pb-4">
            <h1 className="text-xl font-serif font-bold text-[#3B2314] uppercase tracking-widest">
              Staff Portal Authentication
            </h1>
            <p className="text-xs text-[#3B2314]/70 font-light">
              Enter your authorized staff credentials to enter TailAdmin
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-[#FAF0EF] border border-[#E8C2BF] text-[#8F423B] text-xs flex items-start gap-2.5 rounded-none animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#3B2314] font-semibold mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3B2314]/50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@libasedastaan.com"
                  className="w-full bg-[#FAF6F0] border border-[#D8CEC4] pl-10 pr-4 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 focus:outline-none focus:border-[#9E5A38] rounded-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#3B2314] font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3B2314]/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#FAF6F0] border border-[#D8CEC4] pl-10 pr-10 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 focus:outline-none focus:border-[#9E5A38] rounded-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3B2314]/50 hover:text-[#3B2314]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 rounded-none shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to TailAdmin</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
