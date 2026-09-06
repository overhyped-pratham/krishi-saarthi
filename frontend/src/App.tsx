import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Eager loads
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Lazy loads
const KrishiSaarthiDashboardPage = lazy(() => import('./pages/KrishiSaarthiDashboardPage'));
const FarmsListPage = lazy(() => import('./pages/FarmsListPage'));
const CropDoctorPage = lazy(() => import('./pages/CropDoctorPage'));
const RegisterFarmPage = lazy(() => import('./pages/RegisterFarmPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />
            <main className="flex-1 pt-14">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/krishi-saarthi" element={<KrishiSaarthiDashboardPage />} />
                  <Route path="/dashboard" element={<KrishiSaarthiDashboardPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/farms" element={<ProtectedRoute><FarmsListPage /></ProtectedRoute>} />
                  <Route path="/doctor" element={<ProtectedRoute><CropDoctorPage /></ProtectedRoute>} />
                  <Route path="/register" element={<ProtectedRoute><RegisterFarmPage /></ProtectedRoute>} />
                  <Route path="/onboard" element={<ProtectedRoute><RegisterFarmPage /></ProtectedRoute>} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
