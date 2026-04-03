import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../db";
import crypto from "crypto-js";
import {
  ArrowLeft,
  Lock,
  User,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/**
 * ForgotPasswordScreen Component
 * Step 1: Enter username
 * Step 2: Answer security question
 * Step 3: Set new password
 * Step 4: Success
 */
export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Username, 2: Security Q, 3: New Password, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Username
  const [username, setUsername] = useState("");

  // Step 2: Security question & answer
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);

  // Step 3: New password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hashPassword = (password: string): string => {
    return crypto.SHA256(password).toString();
  };

  // Step 1: Find user by username
  const handleFindUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!username.trim()) {
        setError("Please enter your username");
        setLoading(false);
        return;
      }

      const user = await db.getUserByUsername(username);

      if (!user) {
        setError(
          "❌ Username not found. Please check and try again or create a new account.",
        );
        setLoading(false);
        return;
      }

      setFoundUser(user);
      // Note: In a real app, you'd have different security questions
      // For now, we'll use a generic one
      setSecurityQuestion("What is your mother's maiden name?");
      setStep(2);
      setSuccess("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to find user account",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify security answer
  const handleVerifySecurityAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!securityAnswer.trim()) {
        setError("Please answer the security question");
        setLoading(false);
        return;
      }

      // Hash the security answer and compare
      const hashedAnswer = hashPassword(securityAnswer.toLowerCase());

      if (foundUser.recoveryAnswer !== hashedAnswer) {
        setError("❌ Incorrect security answer. Please try again.");
        setLoading(false);
        return;
      }

      console.log("✅ Security answer verified!");
      setStep(3);
      setSuccess("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verification failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!newPassword) {
        setError("Please enter a new password");
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      // Check if new password is same as old password
      const oldHashedPassword = hashPassword(username); // Old password (for demo)
      const newHashedPassword = hashPassword(newPassword);

      if (oldHashedPassword === newHashedPassword) {
        setError("Your new password cannot be the same as your old password");
        setLoading(false);
        return;
      }

      // Update password in database
      const updatedUser = {
        ...foundUser,
        hashedPassword: newHashedPassword,
      };

      await db.updateUser(updatedUser);

      console.log("✅ Password reset successfully!");
      setStep(4);
      setSuccess("Your password has been reset successfully!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#064e3b] to-[#065f46] p-4 sm:p-8">
      {/* Main Card */}
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden min-h-[600px]">
        {/* LEFT SIDE: Visual (Green Gradient) */}
        <div className="w-full lg:w-3/5 bg-gradient-to-tr from-[#059669] via-[#10b981] to-[#34d399] p-8 sm:p-12 relative flex flex-col justify-center overflow-hidden">
          {/* Abstract shapes */}
          <div className="absolute top-[-10%] left-[-5%] w-64 h-24 bg-white/20 rounded-full rotate-[35deg] blur-sm" />
          <div className="absolute bottom-12 left-[-10%] w-72 h-32 bg-emerald-900/10 rounded-full rotate-[35deg]" />
          <div className="absolute top-1/2 right-[-5%] w-48 h-16 bg-white/10 rounded-full rotate-[35deg]" />
          <div className="absolute bottom-[-10%] right-[10%] w-64 h-24 bg-emerald-900/20 rounded-full rotate-[35deg]" />

          <div className="relative z-10 max-w-md">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 md:mb-6 leading-tight">
              Reset Your <br /> Password
            </h1>
            <p className="text-emerald-50 text-base md:text-lg leading-relaxed mb-6 md:mb-8 opacity-90">
              Securely recover access to your RankIt ZM account
            </p>
            <div className="h-1 w-20 bg-white/30 rounded-full" />

            {/* Progress Steps */}
            <div className="mt-12 space-y-4">
              {[
                { num: 1, label: "Find Account" },
                { num: 2, label: "Verify Identity" },
                { num: 3, label: "New Password" },
                { num: 4, label: "Complete" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step >= s.num
                        ? "bg-white text-emerald-600"
                        : "bg-emerald-800/30 text-emerald-100"
                    }`}
                  >
                    {step > s.num ? "✓" : s.num}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      step >= s.num ? "text-white" : "text-emerald-100/70"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full lg:w-2/5 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-[340px] mx-auto w-full">
            {/* Header */}
            <header className="mb-8 sm:mb-10">
              <p className="text-[#059669] text-xs font-black uppercase tracking-[0.3em] mb-2">
                Account Recovery
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                {step === 1 && "Find Your Account"}
                {step === 2 && "Verify Your Identity"}
                {step === 3 && "Create New Password"}
                {step === 4 && "Password Reset"}
              </h2>
            </header>

            {/* Success Message */}
            {step === 4 && success && (
              <div className="py-10 text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Success!
                </h3>
                <p className="text-slate-500 mb-6">{success}</p>
                <p className="text-xs text-slate-400">
                  Redirecting to login...
                </p>
              </div>
            )}

            {/* Step 1: Find Account */}
            {step === 1 && (
              <form
                onSubmit={handleFindUser}
                className="space-y-4 sm:space-y-5"
              >
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700/40 flex-shrink-0" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-emerald-50/50 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 placeholder:text-emerald-700/30 disabled:opacity-50 text-sm sm:text-base"
                    placeholder="Enter your username"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#059669] to-[#10b981] text-white font-bold py-3 sm:py-4 rounded-full shadow-lg hover:shadow-emerald-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2 text-base sm:text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      SEARCHING...
                    </>
                  ) : (
                    "FIND ACCOUNT"
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Verify Security Answer */}
            {step === 2 && (
              <form
                onSubmit={handleVerifySecurityAnswer}
                className="space-y-4 sm:space-y-5"
              >
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    {securityQuestion}
                  </p>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700/40 flex-shrink-0" />
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-white border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 placeholder:text-emerald-700/30 disabled:opacity-50 text-sm sm:text-base"
                      placeholder="Your answer (case insensitive)"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1 px-4 py-3 sm:py-3.5 rounded-full border border-emerald-100 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft size={16} />
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-gradient-to-r from-[#059669] to-[#10b981] text-white font-bold py-3 sm:py-3.5 rounded-full shadow-lg hover:shadow-emerald-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        VERIFYING...
                      </>
                    ) : (
                      "VERIFY"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form
                onSubmit={handleResetPassword}
                className="space-y-4 sm:space-y-5"
              >
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700/40 flex-shrink-0" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-emerald-50/50 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 placeholder:text-emerald-700/30 disabled:opacity-50 text-sm sm:text-base"
                    placeholder="New password (min 6 chars)"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700/40 flex-shrink-0" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-emerald-50/50 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 placeholder:text-emerald-700/30 disabled:opacity-50 text-sm sm:text-base"
                    placeholder="Confirm password"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1 px-4 py-3 sm:py-3.5 rounded-full border border-emerald-100 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft size={16} />
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-gradient-to-r from-[#059669] to-[#10b981] text-white font-bold py-3 sm:py-3.5 rounded-full shadow-lg hover:shadow-emerald-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        RESETTING...
                      </>
                    ) : (
                      "RESET PASSWORD"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            {step !== 4 && (
              <div className="mt-8 sm:mt-12">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
                  Protected by RankIt ZM Security
                </p>

                <div className="text-center text-xs sm:text-sm">
                  <p className="text-slate-600">
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      disabled={loading}
                      className="text-emerald-600 hover:text-emerald-800 font-bold transition disabled:opacity-50"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
