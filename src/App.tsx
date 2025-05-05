
import React, { useEffect, useState } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  useNavigate,
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
  const { session, loading: isLoading } = useAuth();
  const navigate = useNavigate();
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    if (!session) {
      navigate('/login');
    } else {
      navigate('/dashboard');
    }
  }, [session, navigate, isFirstRender]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {session ? (
        <RouterProvider router={createBrowserRouter([
          {
            path: "/dashboard",
            element: <Dashboard />,
          },
          {
            path: "/community",
            element: <CommunityDirectory />,
          },
          {
            path: "/profile",
            element: <ProfileForm 
              profile={null} 
              isSubmitting={false} 
              onSubmit={() => {}} 
              onCancel={() => {}}
            />,
          },
          {
            path: "/admin",
            element: <AdminDashboard />,
          },
        ])} />
      ) : (
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['github', 'google']}
        />
      )}
    </>
  );
}

export default App;
