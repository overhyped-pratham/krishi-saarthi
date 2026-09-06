import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'

// ── Eager (always needed on first paint) ───────────────────────────────────
import LandingPage from './pages/LandingPage'
import LoginPage   from './pages/LoginPage'

// ── Lazy (loaded only when navigated to) ──────────────────────────────────
const KrishiSaarthiDashboardPage = lazy(() => import('./pages/KrishiSaarthiDashboardPage'))
const StateCooperationPage        = lazy(() => import('./pages/StateCooperationPage'))
const RegisterFarmPage            = lazy(() => import('./pages/RegisterFarmPage'))
const FarmsListPage               = lazy(() => import('./pages/FarmsListPage'))
const DashboardPage               = lazy(() => import('./pages/DashboardPage'))
const SatelliteViewPage           = lazy(() => import('./pages/SatelliteViewPage'))
const ClaimVerificationPage       = lazy(() => import('./pages/ClaimVerificationPage'))
const LedgerPage                  = lazy(() => import('./pages/LedgerPage'))
const InsurerDashboardPage        = lazy(() => import('./pages/InsurerDashboardPage'))
const FarmerOnboardPage           = lazy(() => import('./pages/FarmerOnboardPage'))
const WeatherForecastPage         = lazy(() => import('./pages/WeatherForecastPage'))
const MarketInsightsPage          = lazy(() => import('./pages/MarketInsightsPage'))
const PitchDeckPage               = lazy(() => import('./pages/PitchDeckPage'))
const CropDoctorPage              = lazy(() => import('./pages/CropDoctorPage'))

// ── Shared loading fallback ────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-xs font-mono text-white/30 tracking-widest uppercase">Loading</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <div className="min-h-screen bg-black flex flex-col">
            <Navbar />
            <main className="flex-1 w-full overflow-x-hidden pt-16 pb-20 md:pb-0">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* 1. First Landing Page according to Architecture */}
                  <Route path="/"        element={<LandingPage />} />
                  <Route path="/landing" element={<LandingPage />} />

                  {/* 2. Krishi Saarthi Operational Command Center */}
                  <Route path="/krishi-saarthi" element={<KrishiSaarthiDashboardPage />} />
                  <Route path="/dashboard"      element={<KrishiSaarthiDashboardPage />} />

                  {/* 3. Cooperative State Agricultural Model Registry */}
                  <Route path="/cooperation" element={<StateCooperationPage />} />

                  {/* Public utility routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/pitch" element={<PitchDeckPage />} />
                  <Route path="/display" element={<PitchDeckPage />} />

                  {/* Protected routes */}
                  <Route path="/onboard"  element={<ProtectedRoute><FarmerOnboardPage /></ProtectedRoute>} />
                  <Route path="/register" element={<ProtectedRoute><RegisterFarmPage /></ProtectedRoute>} />
                  <Route path="/farms"    element={<ProtectedRoute><FarmsListPage /></ProtectedRoute>} />
                  <Route path="/doctor"   element={<ProtectedRoute><CropDoctorPage /></ProtectedRoute>} />
                  <Route path="/weather"  element={<ProtectedRoute><WeatherForecastPage /></ProtectedRoute>} />
                  <Route path="/market"   element={<ProtectedRoute><MarketInsightsPage /></ProtectedRoute>} />
                  <Route path="/ledger"   element={<ProtectedRoute><LedgerPage /></ProtectedRoute>} />
                  <Route path="/insurer"  element={<ProtectedRoute><InsurerDashboardPage /></ProtectedRoute>} />
                  <Route path="/dashboard/:farmId"           element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/dashboard/:farmId/satellite" element={<ProtectedRoute><SatelliteViewPage /></ProtectedRoute>} />
                  <Route path="/claim/:claimId"              element={<ProtectedRoute><ClaimVerificationPage /></ProtectedRoute>} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
