import React, { useState } from "react";
import { UserRole } from "../types";
import { Building2, ShieldCheck, Eye, EyeOff, Lock, User, Terminal, RotateCw } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (username: string, role: UserRole) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<UserRole>("Operator");
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setErrorMsg("Please provide your Operator ID or Username.");
      return;
    }
    if (!password) {
      setErrorMsg("Security clearance credentials (password) are required.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Simulate enterprise SCADA handshake latency
      setTimeout(async () => {
        try {
          await onLoginSuccess(username, role);
        } catch (err: any) {
          setErrorMsg("DCS Handshake rejected. Check network configurations.");
        } finally {
          setLoading(false);
        }
      }, 900);
    } catch (err) {
      setErrorMsg("Authentication gateway connection timeout.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#E0E0E0] font-sans flex items-center justify-center p-4 select-none">
      
      {/* Decorative Blueprint Background grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#FF6B00_0.7px,transparent_0.7px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
      
      {/* Central Login Box card */}
      <div className="relative w-full max-w-md bg-[#131722] border border-[#232C3A] rounded-xl shadow-[0_12px_45px_rgba(0,0,0,0.6)] p-8 overflow-hidden z-10 transition-all">
        
        {/* Style orange border accent top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500" />
        
        {/* Logo/Branding Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-orange-500" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-[0.25em] text-white uppercase">
              SONATRACH
            </h1>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">
              Isomerization Refinery Process Portal
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Error Prompt */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Operator ID / Username input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Operator Username / Core ID
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yamina.difllah@sonatrach.dz"
                className="w-full bg-black/35 border border-[#232C3A] hover:border-orange-500/40 focus:border-orange-500 focus:outline-none rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-white transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Secure Clearance Password field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Clearance Passkey
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/35 border border-[#232C3A] hover:border-orange-500/40 focus:border-orange-500 focus:outline-none rounded-lg pl-10 pr-11 py-3 text-sm font-mono text-white transition-all placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Dual Role Toggle buttons */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">
              Assigned Authorization Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["Operator", "AI Engineer"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 rounded-lg border text-xs font-semibold font-display tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 ${
                    role === r
                      ? "bg-orange-500/10 border-orange-500 text-white shadow-md shadow-orange-500/5 font-bold"
                      : "bg-black/25 border-[#232C3A] text-gray-400 hover:bg-black/40 hover:text-white"
                  }`}
                >
                  <Terminal className={`w-3.5 h-3.5 ${role === r ? "text-orange-500" : "text-gray-600"}`} />
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-400 transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded accent-orange-500 bg-black/40 border-[#232C3A] cursor-pointer"
              />
              <span className="font-mono text-[10px] uppercase tracking-wider">Remember Operator</span>
            </label>
            <span className="text-[10px] uppercase font-mono text-orange-500 hover:underline cursor-not-allowed">Reset Node Clearances?</span>
          </div>

          {/* Handshake Submit buttons */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:from-orange-850 disabled:to-orange-900 text-white font-bold font-display uppercase tracking-wider text-xs py-3.5 rounded-lg transition-all shadow-[0_4px_15px_rgba(244,122,32,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                DCS Auth Handshake...
              </>
            ) : (
              <>
                Confirm SCADA Connection
              </>
            )}
          </button>
        </form>

        {/* Footer Credit line */}
        <div className="mt-8 text-center border-t border-[#232C3A]/60 pt-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
          Developed by: Yaminaa Difllah &bull; SONATRACH Refineries
        </div>
      </div>
    </div>
  );
};
