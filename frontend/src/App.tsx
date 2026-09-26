/**
 * FlowTrack — An Agile-Oriented Full-Stack Project and Task Management System
 * IGNOU BCA (BCSP-064) | Developer: Ankit Singh | Enrollment: 2252096267
 */
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ReportsPage from './pages/ReportsPage';
import TeamPage from './pages/TeamPage';
import ProtectedRoute from './components/ProtectedRoute';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    background: { default: '#0f172a', paper: '#1e293b' },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", sans-serif',
  },
  components: {
    MuiMenuItem: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: '#334155' } },
      },
    },
  },
});

const App: React.FC = () => {
  const initAuth = useAuthStore((s) => s.initAuth);
  useEffect(() => { initAuth(); }, [initAuth]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
