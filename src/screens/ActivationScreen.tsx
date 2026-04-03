import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  School,
  User,
  ShieldCheck,
  ClipboardCheck,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { db } from "../db";
import crypto from "crypto-js";

// Mobile-responsive hook
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024,
  );
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isMobile, isTablet, isDesktop };
};

/**
 * ActivationScreen Component
 * A multi-step onboarding process for new school administrators.
 * NOW: Mobile-responsive with adaptive layouts + IndexedDB storage
 */
export default function ActivationScreen() {
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  // Step 1: School info
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");

  // Load school data on mount
  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        const school = await db.getSchool(1);
        if (school) {
          setSchoolName(school.schoolName || "");
          setSchoolAddress(school.schoolAddress || "");
        }
      } catch (err) {
        console.error("Failed to load school data:", err);
      }
    };
    loadSchoolData();
  }, []);

  // Step 2: User info
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3: Security question
  const [securityQuestion, setSecurityQuestion] = useState(
    "What is your mother's maiden name?",
  );
  const [securityAnswer, setSecurityAnswer] = useState("");

  const hashPassword = (password: string): string => {
    return crypto.SHA256(password).toString();
  };

  const handleNextStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (step === 1) {
      if (!schoolName.trim() || !schoolAddress.trim()) {
        setError("Please fill in all school details.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!username.trim() || password.length < 6) {
        setError(
          "Username is required and password must be at least 6 characters.",
        );
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!securityAnswer.trim()) {
        setError("Please provide a security answer.");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      completeActivation();
    }
  };

  const completeActivation = async () => {
    setLoading(true);
    setError("");

    try {
      const existingUser = await db.getUserByUsername(username);
      if (existingUser) {
        setError(
          "Username already exists. Please choose a different username.",
        );
        setLoading(false);
        return;
      }

      const hashedPassword = hashPassword(password);
      const hashedSecurityAnswer = hashPassword(securityAnswer.toLowerCase());

      const newUser = {
        username: username.trim(),
        hashedPassword: hashedPassword,
        recoveryAnswer: hashedSecurityAnswer,
      };

      await db.addUser(newUser);
      console.log("✅ User created successfully:", username);

      const schoolData = {
        schoolName: schoolName.trim(),
        schoolAddress: schoolAddress.trim(),
      };
      await db.addSchool(schoolData);
      console.log("✅ School data saved successfully:", schoolName);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      let term = "Term1";
      if (currentMonth >= 4 && currentMonth < 8) {
        term = "Term2";
      } else if (currentMonth >= 8) {
        term = "Term3";
      }

      const defaultSettings = {
        term: term,
        year: currentYear,
        primaryPassingRate: 50,
        secondaryPassingRate: 40,
        useEducationLevelRates: true,
        headteacherName: "",
        deputyHeadteacherName: "",
        lastModified: Date.now(),
        modifiedBy: username.trim(),
      };
      await db.updateSchoolSettings(defaultSettings);
      console.log("✅ School settings initialized:", term, currentYear);

      localStorage.setItem("rankit_school_name", schoolName);

      setIsComplete(true);

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create account";
      setError(`Error: ${errorMsg}`);
      console.error("Account creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
    setError("");
  };

  const steps = [
    { id: 1, label: "School", icon: School },
    { id: 2, label: "Account", icon: User },
    { id: 3, label: "Security", icon: ShieldCheck },
    { id: 4, label: "Confirm", icon: ClipboardCheck },
  ];

  if (isComplete) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#064e3b] to-[#065f46] p-4">
        <div
          className={`w-full ${isMobile ? "max-w-sm" : "max-w-md"} bg-white rounded-[2.5rem] shadow-2xl ${isMobile ? "p-8" : "p-12"} text-center animate-in zoom-in-95 duration-500`}
        >
          <div
            className={`${isMobile ? "w-20 h-20" : "w-24 h-24"} bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner`}
          >
            <CheckCircle2 className={isMobile ? "w-10 h-10" : "w-12 h-12"} />
          </div>
          <h2
            className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold text-slate-800 mb-2`}
          >
            Success!
          </h2>
          <p
            className={`text-slate-500 mb-8 font-medium ${isMobile ? "text-sm" : "text-base"}`}
          >
            Your school account has been activated. You can now login to the
            management portal.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gradient-to-r from-[#059669] to-[#10b981] text-white font-bold py-4 rounded-full shadow-lg hover:shadow-emerald-200 transition-all active:scale-95"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#064e3b] to-[#065f46] ${isMobile ? "p-3 py-8" : "p-4 sm:p-8"} font-sans`}
    >
      <div
        className={`w-full ${isMobile ? "max-w-full" : isTablet ? "max-w-2xl" : "max-w-4xl"} bg-white ${isMobile ? "rounded-2xl" : "rounded-[2.5rem]"} shadow-2xl flex ${isDesktop ? "flex-row" : "flex-col"} overflow-hidden ${isMobile ? "min-h-auto" : "min-h-[650px]"}`}
      >
        {/* LEFT SIDE: Identity & Progress - Hidden on Mobile */}
        {isDesktop && (
          <div className="w-2/5 bg-gradient-to-tr from-[#059669] via-[#10b981] to-[#34d399] p-10 relative flex flex-col overflow-hidden">
            <div className="absolute top-[-5%] left-[-10%] w-64 h-24 bg-white/10 rounded-full rotate-[35deg] blur-sm" />
            <div className="absolute bottom-[-5%] right-[-10%] w-64 h-24 bg-emerald-900/20 rounded-full rotate-[35deg]" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-10">
                <h1 className="text-3xl font-black text-white leading-tight mb-2 tracking-tight">
                  Account <br /> Activation
                </h1>
                <div className="h-1.5 w-12 bg-white/40 rounded-full" />
              </div>

              <div className="flex-1 space-y-8">
                {steps.map((s) => {
                  const Icon = s.icon;
                  const isActive = step >= s.id;
                  return (
                    <div key={s.id} className="flex items-center gap-4 group">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                          isActive
                            ? "bg-white text-emerald-600 scale-110"
                            : "bg-emerald-800/20 text-emerald-100 border border-white/20"
                        }`}
                      >
                        <Icon size={22} />
                      </div>
                      <div>
                        <p
                          className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-white" : "text-emerald-100/50"}`}
                        >
                          Step 0{s.id}
                        </p>
                        <p
                          className={`text-sm font-bold ${isActive ? "text-white" : "text-emerald-100/70"}`}
                        >
                          {s.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto">
                <p className="text-emerald-50/60 text-[11px] font-medium leading-relaxed">
                  RankIt ZM Onboarding Portal <br />
                  Ministry of Education, Zambia
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE: Step Indicator as Horizontal Progress */}
        {isMobile && (
          <div className="bg-gradient-to-r from-[#059669] to-[#10b981] p-4 flex justify-between items-center">
            {steps.map((s) => {
              const isActive = step >= s.id;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-white text-emerald-600 scale-100"
                        : "bg-emerald-800/30 text-white border border-white/30"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <p
                    className={`text-[8px] font-bold mt-1 ${isActive ? "text-white" : "text-emerald-100/60"}`}
                  >
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* RIGHT SIDE: Form Entry */}
        <div
          className={`w-full ${isDesktop ? "w-3/5" : ""} ${isMobile ? "p-6" : "p-8 sm:p-14"} flex flex-col justify-center`}
        >
          <div className={isMobile ? "w-full" : "max-w-md mx-auto w-full"}>
            <header className={isMobile ? "mb-6" : "mb-8"}>
              <p className="text-[#059669] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                Secure Registration
              </p>
              <h2
                className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold text-slate-800`}
              >
                {step === 1 && "Institution Details"}
                {step === 2 && "Admin Account"}
                {step === 3 && "Security Layer"}
                {step === 4 && "Final Review"}
              </h2>
            </header>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  !
                </div>
                {error}
              </div>
            )}

            <form onSubmit={handleNextStep} className="space-y-6">
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-5">
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                      School Name
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Lusaka Central High"
                      className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 text-base"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                      Physical Address
                    </label>
                    <textarea
                      required
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      placeholder="Complete location address..."
                      rows={isMobile ? 2 : 3}
                      className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 resize-none text-base"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-5">
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                      Administrative Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username (min 3 chars)"
                      className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 text-base"
                    />
                  </div>
                  <div
                    className={`${isMobile ? "grid grid-cols-1" : "grid grid-cols-2"} gap-4`}
                  >
                    <div className="relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 text-base"
                      />
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                        Confirm
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 text-base"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-5">
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                      Security Question
                    </label>
                    <select
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 appearance-none cursor-pointer text-base"
                    >
                      <option>What is your mother's maiden name?</option>
                      <option>What was the name of your first pet?</option>
                      <option>In what city were you born?</option>
                    </select>
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                      Security Answer
                    </label>
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="Secret Answer (case insensitive)"
                      className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-full focus:ring-4 focus:ring-emerald-500/10 focus:border-[#10b981] transition-all outline-none text-slate-700 text-base"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in zoom-in-95 duration-500 space-y-3">
                  <div
                    className={`p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100 space-y-4`}
                  >
                    <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                        School
                      </span>
                      <span
                        className={`font-bold text-slate-700 ${isMobile ? "text-xs" : "text-sm"}`}
                      >
                        {schoolName}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                        Admin
                      </span>
                      <span
                        className={`font-bold text-slate-700 ${isMobile ? "text-xs" : "text-sm"}`}
                      >
                        {username}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                        Recovery
                      </span>
                      <span
                        className={`font-bold text-slate-700 italic ${isMobile ? "text-xs" : "text-sm"}`}
                      >
                        Enabled
                      </span>
                    </div>
                  </div>
                  <p
                    className={`text-center mt-4 ${isMobile ? "text-[11px]" : "text-xs"} text-slate-500`}
                  >
                    ✅ Account data will be saved securely to the database
                  </p>
                </div>
              )}

              <div
                className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4 pt-6`}
              >
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className={`${isMobile ? "w-full" : "flex-1"} px-4 py-4 rounded-full border border-emerald-100 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                  >
                    ← Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`${isMobile ? "w-full" : "flex-[2]"} bg-gradient-to-r from-[#059669] to-[#10b981] text-white font-bold py-4 rounded-full shadow-lg hover:shadow-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      SAVING...
                    </>
                  ) : step === 4 ? (
                    "ACTIVATE ACCOUNT"
                  ) : (
                    <>
                      CONTINUE
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className={isMobile ? "mt-8" : "mt-12"}>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center">
                Secure RankIt ZM Portal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
