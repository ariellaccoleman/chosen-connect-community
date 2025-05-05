
import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from "react-router-dom";
import './App.css';
import { useAuth } from "./hooks/useAuth";
import { Auth } from "@supabase/auth-ui-react";
import {
  ThemeSupa,
} from "@supabase/auth-ui-shared";
import Dashboard from "./pages/Dashboard";
import CommunityDirectory from "./pages/CommunityDirectory";
import ProfileForm from "./components/profile/ProfileForm";
import AdminDashboard from "@/pages/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";

const App = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect logic when auth state changes
  useEffect(() => {
    if (!loading) {
      if (!session && !location.pathname.includes('/login')) {
        navigate('/login');
      } else if (session && location.pathname === '/login') {
        navigate('/dashboard');
      }
    }
  }, [session, loading, navigate, location.pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {!session && location.pathname === '/login' ? (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['github', 'google']}
          />
        </div>
      ) : (
        <Routes>
          <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/community" element={session ? <CommunityDirectory /> : <Navigate to="/login" />} />
          <Route path="/profile" element={
            session ? 
              <ProfileForm 
                profile={null} 
                isSubmitting={false} 
                onSubmit={() => {}} 
                onCancel={() => {}}
              /> : 
              <Navigate to="/login" />
          } />
          <Route path="/admin" element={session ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/login" element={!session ? (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['github', 'google']}
              />
            </div>
          ) : <Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
        </Routes>
      )}
    </>
  );
}

export default App;
