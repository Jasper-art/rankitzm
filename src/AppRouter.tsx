import React, { Suspense, lazy } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { OfflineProvider } from "./context/OfflineContext";
import { MainLayout } from "./components/MainLayout";
import { OfflineWarningBanner } from "./components/OfflineWarningBanner";
import { OfflineLoggerDashboard } from "./components/OfflineLoggerDashboard";
import "./styles/rankitz-globals.css";

// Lazy load screens
const SplashScreen = lazy(() => import("./screens/SplashScreen"));
const LoginScreen = lazy(() => import("./screens/LoginScreen"));
const ActivationScreen = lazy(() => import("./screens/ActivationScreen"));
const SubscriptionScreen = lazy(() => import("./screens/SubscriptionScreen"));

// Main app screens
const HomeScreen = lazy(() => import("./screens/HomeScreen"));
const ClassesScreen = lazy(() => import("./screens/ClassesScreen"));
const AddClassScreen = lazy(() => import("./screens/AddClassScreen"));

// Learner management
const LearnerListScreen = lazy(() => import("./screens/LearnerListScreen"));
const AddLearnerScreen = lazy(() => import("./screens/AddLearnerScreen"));
const EditLearnerScreen = lazy(() => import("./screens/EditLearnerScreen"));
const LearnerScoresScreen = lazy(() => import("./screens/LearnerScoresScreen"));

// Subject management
const AddSubjectScreen = lazy(() => import("./screens/AddSubjectScreen"));
const EditSubjectScreen = lazy(() => import("./screens/EditSubjectScreen"));

// Test/Scores
const TestsScreen = lazy(() => import("./screens/TestsScreen"));
const EnterScoresByLearnerScreen = lazy(
  () => import("./screens/EnterScoresByLearnerScreen"),
);
const EnterScoresBySubjectScreen = lazy(
  () => import("./screens/EnterScoresBySubjectScreen"),
);
const ViewScoresScreen = lazy(() => import("./screens/ViewScoresScreen"));
const ScoresTableScreen = lazy(() => import("./screens/ScoresTableScreen"));

// Reports
const ReportsScreen = lazy(() => import("./screens/ReportsScreen"));
const ProgressReportScreen = lazy(
  () => import("./screens/ProgressReportScreen"),
);

// Settings
const SchoolSettingsScreen = lazy(
  () => import("./screens/SchoolSettingsScreen"),
);
const AccountInfoScreen = lazy(() => import("./screens/AccountInfoScreen"));
const AboutRankitScreen = lazy(() => import("./screens/AboutRankitScreen"));

// ========== PHASE 3 - UTILITIES (5 screens) ==========
const EditSchoolInfoScreen = lazy(
  () => import("./screens/EditSchoolInfoScreen"),
);
const LearnerSubjectScoresScreen = lazy(
  () => import("./screens/LearnerSubjectScoresScreen"),
);
const ConsolidatedCustomReportScreen = lazy(
  () => import("./screens/ConsolidatedCustomReportScreen"),
);

// ========== PHASE 4 - ADVANCED ANALYTICS (6 screens) ==========
const ClassPerformanceScreen = lazy(
  () => import("./screens/ClassPerformanceScreen"),
);
const SubjectAnalysisScreen = lazy(
  () => import("./screens/SubjectAnalysisScreen"),
);
const AnalysisScreen = lazy(() => import("./screens/AnalysisScreen"));
const RankingScreen = lazy(() => import("./screens/RankingScreen"));
const PerformanceTrendScreen = lazy(
  () => import("./screens/PerformanceTrendScreen"),
);
const ClassComparisonScreen = lazy(
  () => import("./screens/ClassComparisonScreen"),
);
const DetailedLearnerAnalysisScreen = lazy(
  () => import("./screens/DetailedLearnerAnalysisScreen"),
);

// ========== PHASE 5 - SCHOOL MANAGEMENT (5 screens) ==========
const SubjectManagementScreen = lazy(
  () => import("./screens/SubjectManagementScreen"),
);
const ClassManagementScreen = lazy(
  () => import("./screens/ClassManagementScreen"),
);
const DataManagementScreen = lazy(
  () => import("./screens/DataManagementScreen"),
);
const NotificationsScreen = lazy(() => import("./screens/NotificationsScreen"));

// ========== PHASE 6 - REPORTING & EXPORT (4 screens) ==========
const BulkReportGeneratorScreen = lazy(
  () => import("./screens/BulkReportGeneratorScreen"),
);
const PrintSettingsScreen = lazy(() => import("./screens/PrintSettingsScreen"));
const TemplateManagementScreen = lazy(
  () => import("./screens/TemplateManagementScreen"),
);
const ExportManagerScreen = lazy(() => import("./screens/ExportManagerScreen"));

// Additional utility screens
const ClassDetailScreen = lazy(() => import("./screens/ClassDetailScreen"));
const BaseReportScreen = lazy(() => import("./screens/BaseReportScreen"));
const ReportDetailScreen = lazy(() => import("./screens/ReportDetailScreen"));
const CustomReportScreen = lazy(() => import("./screens/CustomReportScreen"));
const LearnerStatementScreen = lazy(
  () => import("./screens/LearnerStatementScreen"),
);
const SmsResultsScreen = lazy(() => import("./screens/SmsResultsScreen"));
const ResetPasswordScreen = lazy(() => import("./screens/ResetPasswordScreen"));
const ForgotPasswordScreen = lazy(
  () => import("./screens/ForgotPasswordScreen"),
);
const PaymentFlutterwaveScreen = lazy(
  () => import("./screens/PaymentFlutterwaveScreen"),
);
const PaymentManualScreen = lazy(() => import("./screens/PaymentManualScreen"));

// ========== AI TEACHING ASSISTANT TOOLS ==========
const AIToolsHomeScreen = lazy(() => import("./screens/ai/AIToolsHomeScreen"));
const LessonPlanScreen = lazy(() => import("./screens/ai/LessonPlanScreen"));
const SchemesOfWorkScreen = lazy(
  () => import("./screens/ai/SchemesOfWorkScreen"),
);
const RecordsOfWorkScreen = lazy(
  () => import("./screens/ai/RecordsOfWorkScreen"),
);
const WeeklyForecastScreen = lazy(
  () => import("./screens/ai/WeeklyForecastScreen"),
);
const AIReportGeneratorScreen = lazy(
  () => import("./screens/AIReportGeneratorScreen"),
);

// Loading fallback
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();

  console.log("🛡️ ProtectedRoute check - isLoggedIn:", isLoggedIn);

  if (!isLoggedIn) {
    console.log("❌ User not logged in - redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ User authenticated - rendering MainLayout");
  return <MainLayout>{children}</MainLayout>;
}

function AppRouterContent() {
  const { isLoggedIn } = useAuth();

  console.log("📍 AppRouterContent rendered - isLoggedIn:", isLoggedIn);

  return (
    <OfflineProvider>
      <OfflineWarningBanner />

      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* ========== AUTHENTICATION ROUTES ========== */}
          <Route path="/splash" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/activate" element={<ActivationScreen />} />
          <Route path="/subscribe" element={<SubscriptionScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route
            path="/payment/flutterwave"
            element={<PaymentFlutterwaveScreen />}
          />
          <Route path="/payment/manual" element={<PaymentManualScreen />} />

          {/* ========== MAIN APP ========== */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomeScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== CLASSES ========== */}
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <ClassesScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/add"
            element={
              <ProtectedRoute>
                <AddClassScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:classId/details"
            element={
              <ProtectedRoute>
                <ClassDetailScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:classId/add-learner"
            element={
              <ProtectedRoute>
                <AddLearnerScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:classId/add-subject"
            element={
              <ProtectedRoute>
                <AddSubjectScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:classId/edit-subject/:subjectId"
            element={
              <ProtectedRoute>
                <EditSubjectScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:classId/learners"
            element={
              <ProtectedRoute>
                <LearnerListScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:classId"
            element={
              <ProtectedRoute>
                <ClassDetailScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== LEARNERS ========== */}
          <Route
            path="/learners"
            element={
              <ProtectedRoute>
                <LearnerListScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learners/add"
            element={
              <ProtectedRoute>
                <AddLearnerScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learners/:learnerId/edit"
            element={
              <ProtectedRoute>
                <EditLearnerScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learners/:learnerId/scores"
            element={
              <ProtectedRoute>
                <LearnerScoresScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learners/:learnerId/statement"
            element={
              <ProtectedRoute>
                <LearnerStatementScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== TESTS & SCORES ========== */}
          <Route
            path="/tests"
            element={
              <ProtectedRoute>
                <TestsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/:testType/:classId/by-learner"
            element={
              <ProtectedRoute>
                <EnterScoresByLearnerScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/:testType/:classId/by-subject"
            element={
              <ProtectedRoute>
                <EnterScoresBySubjectScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scores/:testType/:classId"
            element={
              <ProtectedRoute>
                <ViewScoresScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scores/table"
            element={
              <ProtectedRoute>
                <ScoresTableScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== REPORTS ========== */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/progress"
            element={
              <ProtectedRoute>
                <ProgressReportScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== AI TEACHING ASSISTANT ========== */}
          <Route
            path="/ai-tools"
            element={
              <ProtectedRoute>
                <AIToolsHomeScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-tools/lesson-plan"
            element={
              <ProtectedRoute>
                <LessonPlanScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-tools/schemes-of-work"
            element={
              <ProtectedRoute>
                <SchemesOfWorkScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-tools/records-of-work"
            element={
              <ProtectedRoute>
                <RecordsOfWorkScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-tools/weekly-forecast"
            element={
              <ProtectedRoute>
                <WeeklyForecastScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== SETTINGS ========== */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SchoolSettingsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/school"
            element={
              <ProtectedRoute>
                <SchoolSettingsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/account"
            element={
              <ProtectedRoute>
                <AccountInfoScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/about"
            element={
              <ProtectedRoute>
                <AboutRankitScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== PHASE 3 - UTILITIES ========== */}
          <Route
            path="/settings/school/edit"
            element={
              <ProtectedRoute>
                <EditSchoolInfoScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learners/:learnerId/subject-scores"
            element={
              <ProtectedRoute>
                <LearnerSubjectScoresScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/consolidated"
            element={
              <ProtectedRoute>
                <ConsolidatedCustomReportScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/custom"
            element={
              <ProtectedRoute>
                <CustomReportScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:classId/:testType/:term/:year"
            element={
              <ProtectedRoute>
                <BaseReportScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:classId/analysis"
            element={
              <ProtectedRoute>
                <AnalysisScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:classId/:reportId"
            element={
              <ProtectedRoute>
                <ReportDetailScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sms/results"
            element={
              <ProtectedRoute>
                <SmsResultsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <AboutRankitScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== PHASE 4 - ADVANCED ANALYTICS ========== */}
          <Route
            path="/analytics/class-performance/:classId"
            element={
              <ProtectedRoute>
                <ClassPerformanceScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/subject/:subjectId"
            element={
              <ProtectedRoute>
                <SubjectAnalysisScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/rankings/:classId"
            element={
              <ProtectedRoute>
                <RankingScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/trends/:classId"
            element={
              <ProtectedRoute>
                <PerformanceTrendScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/class-comparison"
            element={
              <ProtectedRoute>
                <ClassComparisonScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/learner/:learnerId"
            element={
              <ProtectedRoute>
                <DetailedLearnerAnalysisScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== PHASE 5 - SCHOOL MANAGEMENT ========== */}
          <Route
            path="/management/subjects"
            element={
              <ProtectedRoute>
                <SubjectManagementScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/management/classes"
            element={
              <ProtectedRoute>
                <ClassManagementScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/management/data"
            element={
              <ProtectedRoute>
                <DataManagementScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== PHASE 6 - REPORTING & EXPORT ========== */}
          <Route
            path="/reports/bulk-generate"
            element={
              <ProtectedRoute>
                <BulkReportGeneratorScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/print-settings"
            element={
              <ProtectedRoute>
                <PrintSettingsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/templates"
            element={
              <ProtectedRoute>
                <TemplateManagementScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/export-manager"
            element={
              <ProtectedRoute>
                <ExportManagerScreen />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-reports/:classId/:testType/:term/:year"
            element={
              <ProtectedRoute>
                <AIReportGeneratorScreen />
              </ProtectedRoute>
            }
          />

          {/* ========== ROOT & FALLBACKS ========== */}
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/splash" replace />
              )
            }
          />
          <Route
            path="*"
            element={<Navigate to={isLoggedIn ? "/home" : "/splash"} replace />}
          />
        </Routes>
      </Suspense>

      {/* Debug panel for offline logs - visible for development */}
      <OfflineLoggerDashboard />
    </OfflineProvider>
  );
}

export function AppRouter() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppRouterContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
