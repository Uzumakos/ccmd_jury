/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';

// Pages (to be created)
import Login from '@/pages/Login';
import Dashboard from '@/pages/admin/Dashboard';
import Groups from '@/pages/admin/Groups';
import Jurys from '@/pages/admin/Jurys';
import JuryDashboard from '@/pages/jury/Dashboard';
import EvaluationForm from '@/pages/jury/EvaluationForm';
import Leaderboard from '@/pages/Leaderboard';
import Presentation from '@/pages/Presentation';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'ADMIN' | 'JURY' }) {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-mesh">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  
  if (role) {
    if (role === 'JURY' && profile?.role !== 'JURY' && profile?.role !== 'ADMIN') {
      return <Navigate to="/" replace />;
    }
    if (role === 'ADMIN' && profile?.role !== 'ADMIN') {
      return <Navigate to="/jury" replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <div className="bg-mesh min-h-screen">
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Admin Routes */}
              <Route path="/" element={
                 <ProtectedRoute role="ADMIN">
                   <Dashboard />
                 </ProtectedRoute>
              } />
              <Route path="/admin/groups" element={
                <ProtectedRoute role="ADMIN">
                  <Groups />
                </ProtectedRoute>
              } />
               <Route path="/admin/jurys" element={
                <ProtectedRoute role="ADMIN">
                  <Jurys />
                </ProtectedRoute>
              } />

              {/* Jury Routes */}
              <Route path="/jury" element={
                <ProtectedRoute role="JURY">
                  <JuryDashboard />
                </ProtectedRoute>
              } />
              <Route path="/jury/evaluer/:groupId" element={
                <ProtectedRoute role="JURY">
                  <EvaluationForm />
                </ProtectedRoute>
              } />

              {/* Public/Shared Routes */}
              <Route path="/classement" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route path="/presentation" element={
                 <ProtectedRoute>
                   <Presentation />
                 </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </div>
      </TooltipProvider>
    </AuthProvider>
  );
}
