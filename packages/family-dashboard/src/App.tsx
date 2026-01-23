import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LandingPage } from "@/pages/LandingPage";

import { DashboardLayout } from "@/layout/DashboardLayout";

// Family Pages
import { DashboardPage } from "@/pages/family/DashboardPage";
import { ActivityPage } from "@/pages/family/ActivityPage";
import { AlertsPage } from "@/pages/family/AlertsPage";
import { ProfilePage } from "@/pages/family/ProfilePage";
import { SettingsPage } from "@/pages/family/SettingsPage";

// Elder Pages
import { HomePage as ElderHomePage } from "@/pages/elder/HomePage";
import { WelcomePage } from "@/pages/elder/WelcomePage";

// Auth
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ProfileSetupPage from "@/pages/auth/ProfileSetupPage";

import { ProtectedRoute } from "@elder-nest/shared";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/profile-setup" element={<ProfileSetupPage />} />

          {/* Elder Portal */}
          <Route path="/elder" element={
            <ProtectedRoute allowedRoles={['elder']}>
              <ElderHomePage />
            </ProtectedRoute>
          } />
          <Route path="/elder/welcome" element={
            <ProtectedRoute allowedRoles={['elder']}>
              <WelcomePage />
            </ProtectedRoute>
          } />

          {/* Family Portal */}
          <Route path="/family" element={
            <ProtectedRoute allowedRoles={['family']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
