import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// ✅ New Advanced Pages (you’ll create them inside /components/)
import ClusterAnalysis from './components/ClusterAnalysis';
import MarketBasket from './components/MarketBasket';
import Recommendations from './components/Recommendations';
import StatsOverview from './components/StatsOverview';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* 🔹 Advanced Features */}
            <Route 
              path="/clusters" 
              element={
                <ProtectedRoute>
                  <ClusterAnalysis />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/market-basket" 
              element={
                <ProtectedRoute>
                  <MarketBasket />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recommendations" 
              element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/stats" 
              element={
                <ProtectedRoute>
                  <StatsOverview />
                </ProtectedRoute>
              } 
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
