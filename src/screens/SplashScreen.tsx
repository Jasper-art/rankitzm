import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../db';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading school data...');
  const [hasError, setHasError] = useState(false);
  const [logoScale, setLogoScale] = useState(0);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [brandingOpacity, setBrandingOpacity] = useState(0);

  // Load school data and handle navigation
  useEffect(() => {
    const initializeSplash = async () => {
      try {
        // Simulate loading with progress
        for (let i = 0; i <= 30; i++) {
          setLoadingProgress(i);
          await new Promise(resolve => setTimeout(resolve, 30));
        }

        // Load school data
        setLoadingText('Preparing interface...');
       // With
const schools = await db.getAllSchools?.() || [];
const schoolData = schools.length > 0 ? schools[0] : null;

        for (let i = 30; i <= 60; i++) {
          setLoadingProgress(i);
          await new Promise(resolve => setTimeout(resolve, 20));
        }

        // Animate logo in
        setLogoScale(1);
        setSchoolName(schoolData?.schoolName || 'Class Manager');
        setLogoUri(schoolData?.logoUri || null);

        // Animate title
        await new Promise(resolve => setTimeout(resolve, 300));
        setTitleOpacity(1);

        // Animate subtitle
        await new Promise(resolve => setTimeout(resolve, 300));
        setSubtitleOpacity(0.8);

        // Continue loading progress
        for (let i = 60; i <= 100; i++) {
          setLoadingProgress(i);
          setLoadingText(
            i < 80 ? 'Almost ready...' :
            i < 95 ? 'Finalizing...' :
            'Starting...'
          );
          await new Promise(resolve => setTimeout(resolve, 15));
        }

        // Animate branding
        await new Promise(resolve => setTimeout(resolve, 300));
        setBrandingOpacity(0.5);

        // Determine navigation target
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (isLoggedIn) {
          navigate('/home', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }

      } catch (error) {
        console.error('Splash screen error:', error);
        setHasError(true);
        setLoadingText('Error occurred - continuing anyway');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (isLoggedIn) {
          navigate('/home', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }
    };

    // Emergency timeout after 8 seconds
    const timeout = setTimeout(() => {
      if (isLoggedIn) {
        navigate('/home', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 8000);

    initializeSplash();

    return () => clearTimeout(timeout);
  }, [navigate, isLoggedIn]);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Animated gradient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orb 1 - Primary */}
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, #aa3bff 0%, transparent 70%)',
            top: '-50px',
            right: '-100px',
            animation: 'float 20s ease-in-out infinite',
          }}
        ></div>

        {/* Orb 2 - Secondary */}
        <div
          className="absolute w-48 h-48 rounded-full blur-3xl opacity-15"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
            bottom: '100px',
            left: '-80px',
            animation: 'float 25s ease-in-out infinite reverse',
          }}
        ></div>

        {/* Orb 3 - Accent */}
        <div
          className="absolute w-56 h-56 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
            bottom: '-50px',
            right: '10%',
            animation: 'float 22s ease-in-out infinite',
          }}
        ></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm">
        {/* Logo with circular progress */}
        <div className="relative w-32 h-32 mb-8 sm:mb-10">
          {/* Circular progress background */}
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 140 140"
          >
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r="65"
              fill="none"
              stroke="rgba(170, 59, 255, 0.15)"
              strokeWidth="3"
            />

            {/* Progress circle */}
            <circle
              cx="70"
              cy="70"
              r="65"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 65}`}
              strokeDashoffset={`${2 * Math.PI * 65 * (1 - loadingProgress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />

            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#aa3bff" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#aa3bff" />
              </linearGradient>
            </defs>
          </svg>

          {/* Logo container */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-purple-200/50 shadow-lg"
            style={{
              transform: `scale(${logoScale})`,
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {logoUri ? (
              <img
                src={logoUri}
                alt="School Logo"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <svg
                className="w-12 h-12 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5m-13-4h8m-8 3h5m-5 3h8m-8 3h5" />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2"
          style={{
            opacity: titleOpacity,
            transition: 'opacity 0.6s ease',
          }}
        >
          {schoolName || 'Class Manager'}
        </h1>

        {/* Subtitle */}
        <p
          className="text-sm sm:text-base text-gray-600 text-center mb-12"
          style={{
            opacity: subtitleOpacity,
            transition: 'opacity 0.6s ease',
          }}
        >
          Educational Excellence Simplified
        </p>

        {/* Loading indicator */}
        <div className="w-full px-6 mb-8">
          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>

          {/* Loading text with spinner */}
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-purple-600 border-t-transparent"
              style={{
                animation: 'spin 0.8s linear infinite',
              }}
            ></div>
            <p
              className={`text-xs sm:text-sm font-medium ${
                hasError ? 'text-red-600' : 'text-purple-600'
              }`}
            >
              {loadingText}
            </p>
          </div>
        </div>
      </div>

      {/* Footer branding */}
      <div
        className="absolute bottom-8 text-center"
        style={{
          opacity: brandingOpacity,
          transition: 'opacity 0.4s ease',
        }}
      >
        <p className="text-xs sm:text-sm text-gray-600">
          Powered by RankIt ZM
        </p>
        <p className="text-xs text-gray-500 mt-1">v1.0</p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(20px);
          }
          75% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}