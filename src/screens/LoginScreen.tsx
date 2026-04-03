import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addActivity } from "../lib/activityLogger";
import {
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login, schoolId, userId } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!username.trim()) {
        setError("Username is required");
        setLoading(false);
        return;
      }
      if (!password) {
        setError("Password is required");
        setLoading(false);
        return;
      }
      if (!recoveryAnswer.trim()) {
        setError("Security answer is required");
        setLoading(false);
        return;
      }

      // Attempt login with credential validation
      const success = await login(username, password, recoveryAnswer);

      if (success) {
        setLoginSuccess(true);

        // ← LOG ACTIVITY (Login successful)
        await addActivity({
          type: "score_entered",
          title: "User logged in",
          subtitle: `${username}`,
          timestamp: Date.now(),
          schoolId: schoolId || "default",
          userId: userId || undefined,
        });
        // ← END LOG ACTIVITY

        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 1000);
      } else {
        setError(
          "❌ Invalid credentials. Please verify your username, password, and security answer.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#064e3b] to-[#065f46] p-4 sm:p-8">
      {/* Main Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden min-h-[600px]">
        {/* LEFT SIDE: Visual Welcome (Green Gradient) */}
        <div className="w-full lg:w-3/5 bg-gradient-to-tr from-[#059669] via-[#10b981] to-[#34d399] p-8 sm:p-12 relative flex flex-col justify-center overflow-hidden">
          {/* Abstract Floating Pill Shapes */}
          <div className="absolute top-[-10%] left-[-5%] w-64 h-24 bg-white/20 rounded-full rotate-[35deg] blur-sm" />
          <div className="absolute bottom-12 left-[-10%] w-72 h-32 bg-emerald-900/10 rounded-full rotate-[35deg]" />
          <div className="absolute top-1/2 right-[-5%] w-48 h-16 bg-white/10 rounded-full rotate-[35deg]" />
          <div className="absolute bottom-[-10%] right-[10%] w-64 h-24 bg-emerald-900/20 rounded-full rotate-[35deg]" />

          <div className="relative z-10 max-w-md">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 md:mb-6 leading-tight">
              Welcome to <br /> RankIt ZM
            </h1>
            <p className="text-emerald-50 text-base md:text-lg leading-relaxed mb-6 md:mb-8 opacity-90">
              Track . Rise . Excel
            </p>
            <div className="h-1 w-20 bg-white/30 rounded-full" />
          </div>
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div className="w-full lg:w-2/5 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-[340px] mx-auto w-full">
            {/* Header */}
            <header className="text-center mb-8 sm:mb-10">
              <p className="text-[#059669] text-xs font-black uppercase tracking-[0.3em] mb-2">
                Member Portal
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                User Login
              </h2>
            </header>

            {loginSuccess ? (
              <div className="py-10 text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  Authenticated
                </h3>
                <p className="text-slate-500">Entering Secure Zone...</p>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Username */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700/40 flex-shrink-0" />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    autoComplete="username"
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-emerald-50/50 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 placeholder:text-emerald-700/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    placeholder="Username"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700/40 flex-shrink-0" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-emerald-50/50 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 placeholder:text-emerald-700/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    placeholder="Password"
                  />
                </div>

                {/* Security Answer */}
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700/40 flex-shrink-0" />
                  <input
                    type="text"
                    id="recoveryAnswer"
                    value={recoveryAnswer}
                    onChange={(e) => setRecoveryAnswer(e.target.value)}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-emerald-50/50 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 placeholder:text-emerald-700/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    placeholder="Security Answer"
                  />
                </div>

                {/* Remember & Forgot Password */}
                <div className="flex justify-between items-center px-1 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                      className="w-4 h-4 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <span className="text-xs text-slate-500 font-medium">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    disabled={loading}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#059669] to-[#10b981] hover:shadow-lg hover:shadow-emerald-200 disabled:shadow-none disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 rounded-full transition-all flex items-center justify-center gap-2 mt-2 text-base sm:text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      SIGN IN
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 sm:mt-12">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
                Protected by RankIt ZM Security
              </p>

              {!loginSuccess && (
                <div className="space-y-2 text-center text-xs sm:text-sm">
                  <p className="text-slate-600">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/activate")}
                      disabled={loading}
                      className="text-emerald-600 hover:text-emerald-800 font-bold transition disabled:opacity-50"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
