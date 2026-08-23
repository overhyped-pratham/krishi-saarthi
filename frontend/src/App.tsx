import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import RegisterFarmPage from './pages/RegisterFarmPage'
import FarmsListPage from './pages/FarmsListPage'
import DashboardPage from './pages/DashboardPage'
import SatelliteViewPage from './pages/SatelliteViewPage'
import ClaimVerificationPage from './pages/ClaimVerificationPage'
import LedgerPage from './pages/LedgerPage'
import InsurerDashboardPage from './pages/InsurerDashboardPage'
import FarmerOnboardPage from './pages/FarmerOnboardPage'
import WeatherForecastPage from './pages/WeatherForecastPage'
import MarketInsightsPage from './pages/MarketInsightsPage'
import PitchDeckPage from './pages/PitchDeckPage'
import CropDoctorPage from './pages/CropDoctorPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-black flex flex-col">
          <Navbar />
          <main className="flex-1 w-full overflow-x-hidden pt-16 pb-20 md:pb-0">
            <Routes>
              {/* Public routes */}
              <Route path="/"       element={<LandingPage />} />
              <Route path="/login"  element={<LoginPage />} />
              <Route path="/pitch"  element={<PitchDeckPage />} />

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
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
