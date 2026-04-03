import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Lock,
  Check,
  Loader2,
} from "lucide-react";

export default function SubscriptionScreen() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"termly" | "yearly">(
    "termly",
  );
  const [paymentMethod, setPaymentMethod] = useState<"manual" | "flutterwave">(
    "manual",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Select Plan, 2: Payment Method, 3: Checkout

  const plans = {
    termly: {
      name: "Termly Plan",
      price: 25000,
      currency: "ZMW",
      period: "per term (3 months)",
      features: [
        "Manage up to 500 students",
        "Unlimited classes",
        "Score entry and tracking",
        "Basic reports",
        "Email support",
      ],
    },
    yearly: {
      name: "Yearly Plan",
      price: 60000,
      currency: "ZMW",
      period: "per year",
      discount: "20% savings",
      features: [
        "Manage up to 1000 students",
        "Unlimited classes",
        "Advanced score analysis",
        "Full reports suite",
        "SMS notifications",
        "Priority email & chat support",
      ],
    },
  };

  const currentPlan = plans[selectedPlan];

  const handleSelectPlan = () => {
    setStep(2);
  };

  const handleSelectPaymentMethod = () => {
    setStep(3);
  };

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      if (paymentMethod === "manual") {
        navigate("/payment/manual", { state: { plan: selectedPlan } });
      } else {
        navigate("/payment/flutterwave", { state: { plan: selectedPlan } });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Payment processing failed",
      );
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#064e3b] to-[#065f46] flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Header with Back Button */}
      <div className="max-w-2xl mx-auto w-full mb-8">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-emerald-100 hover:text-white font-semibold transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto w-full">
        <div className="w-full">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    s <= step
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50"
                      : "bg-white/20 text-white/60"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      s < step ? "bg-emerald-500" : "bg-white/20"
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Select Plan */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-slate-600 text-sm mb-8">Step 1 of 3</p>

              <div className="space-y-4 mb-8">
                {/* Termly Plan Card */}
                <div
                  onClick={() => setSelectedPlan("termly")}
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition ${
                    selectedPlan === "termly"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        {plans.termly.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {plans.termly.period}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl sm:text-4xl font-bold text-emerald-600">
                        {plans.termly.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-600">
                        {plans.termly.currency}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {plans.termly.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-slate-700"
                      >
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{feature}</p>
                      </div>
                    ))}
                  </div>

                  {selectedPlan === "termly" && (
                    <div className="mt-4 pt-4 border-t border-emerald-200">
                      <p className="text-sm font-semibold text-emerald-600">
                        ✓ Selected
                      </p>
                    </div>
                  )}
                </div>

                {/* Yearly Plan Card */}
                <div
                  onClick={() => setSelectedPlan("yearly")}
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition relative ${
                    selectedPlan === "yearly"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {/* Discount Badge */}
                  <div className="absolute -top-3 -right-3 bg-amber-400 text-slate-900 text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                    {plans.yearly.discount}
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        {plans.yearly.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {plans.yearly.period}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl sm:text-4xl font-bold text-emerald-600">
                        {plans.yearly.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-600">
                        {plans.yearly.currency}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {plans.yearly.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-slate-700"
                      >
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{feature}</p>
                      </div>
                    ))}
                  </div>

                  {selectedPlan === "yearly" && (
                    <div className="mt-4 pt-4 border-t border-emerald-200">
                      <p className="text-sm font-semibold text-emerald-600">
                        ✓ Selected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-slate-100 rounded-xl p-4 mb-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-slate-700 font-semibold">
                    Total Amount Due
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                    {currentPlan.price.toLocaleString()} {currentPlan.currency}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSelectPlan}
                className="w-full bg-gradient-to-r from-[#059669] to-[#10b981] hover:shadow-lg hover:shadow-emerald-500/30 text-white font-bold py-3 sm:py-4 px-4 rounded-full transition duration-200 text-base sm:text-lg flex items-center justify-center gap-2"
              >
                Continue to Payment
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                Payment Method
              </h2>
              <p className="text-slate-600 text-sm mb-8">Step 2 of 3</p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-slate-100 rounded-xl p-6 border border-slate-200 mb-8">
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide mb-2">
                  Plan Selected
                </p>
                <p className="font-bold text-slate-900 text-lg">
                  {currentPlan.name}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {currentPlan.period}
                </p>
                <div className="border-t border-slate-300 mt-4 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-700 font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {currentPlan.price.toLocaleString()}{" "}
                      {currentPlan.currency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 mb-8">
                {/* Manual Payment */}
                <div
                  onClick={() => setPaymentMethod("manual")}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition ${
                    paymentMethod === "manual"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        Bank Transfer / Mobile Money
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Pay via bank transfer or Zambian mobile money
                      </p>
                    </div>
                    {paymentMethod === "manual" && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Flutterwave Payment */}
                <div
                  onClick={() => setPaymentMethod("flutterwave")}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition ${
                    paymentMethod === "flutterwave"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        Flutterwave Checkout
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Secure payment via Flutterwave (card, mobile money)
                      </p>
                    </div>
                    {paymentMethod === "flutterwave" && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 border-2 border-slate-300 text-slate-700 font-semibold py-3 sm:py-4 px-4 rounded-full hover:bg-slate-50 transition duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handleSelectPaymentMethod}
                  className="flex-1 bg-gradient-to-r from-[#059669] to-[#10b981] hover:shadow-lg hover:shadow-emerald-500/30 text-white font-bold py-3 sm:py-4 px-4 rounded-full transition duration-200 flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Checkout */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                Confirm Payment
              </h2>
              <p className="text-slate-600 text-sm mb-8">
                Step 3 of 3 - Final step
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-slate-100 rounded-xl p-6 sm:p-8 border border-slate-200 mb-8">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-5 border-b border-slate-300">
                    <p className="text-slate-700 font-semibold">Plan</p>
                    <p className="font-bold text-slate-900">
                      {currentPlan.name}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pb-5 border-b border-slate-300">
                    <p className="text-slate-700 font-semibold">Period</p>
                    <p className="font-bold text-slate-900">
                      {currentPlan.period}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pb-5 border-b border-slate-300">
                    <p className="text-slate-700 font-semibold">
                      Payment Method
                    </p>
                    <p className="font-bold text-slate-900">
                      {paymentMethod === "manual"
                        ? "Bank Transfer"
                        : "Flutterwave"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-lg font-bold text-slate-900">
                      Total Amount
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold text-emerald-600">
                      {currentPlan.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 mb-8 flex gap-3">
                <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-900">
                  Your payment information is secure and encrypted. We never
                  store your card details.
                </p>
              </div>

              {/* Terms */}
              <div className="text-xs text-slate-600 mb-8">
                <p>
                  By clicking "Proceed with Payment", you agree to our Terms of
                  Service and Privacy Policy.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 border-2 border-slate-300 text-slate-700 font-semibold py-3 sm:py-4 px-4 rounded-full hover:bg-slate-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#059669] to-[#10b981] hover:shadow-lg hover:shadow-emerald-500/30 disabled:shadow-none disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 px-4 rounded-full transition duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed with Payment
                      <ArrowLeft className="w-5 h-5 rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-emerald-100 text-xs sm:text-sm mt-8">
            Questions?{" "}
            <a
              href="mailto:support@rankitzm.com"
              className="text-white hover:text-emerald-100 font-semibold transition"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
