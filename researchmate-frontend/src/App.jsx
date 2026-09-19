// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import Search from './pages/Search';
import AISummarizerPage from './pages/AISummarizerPage';
import AIExplainerPage from './pages/AIExplainerPage';
import AIImageStudioPage from './pages/AIImageStudioPage';
import ImageGalleryPage from './pages/ImageGalleryPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          {/* ── Public routes (no auth required) ─────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Protected routes (auth required) ─────────────────── */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/project/:id" element={<ProjectDetail />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/ai/summarize" element={<AISummarizerPage />} />
                    <Route path="/ai/explain" element={<AIExplainerPage />} />
                    <Route path="/ai/image-studio" element={<AIImageStudioPage />} />
                    <Route path="/gallery" element={<ImageGalleryPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);
}


