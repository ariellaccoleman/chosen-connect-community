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
import GuideList from './pages/GuideList';
import GuideDetail from './pages/GuideDetail';
import AdminDashboard from "@/pages/AdminDashboard";

const App = () => {
  const { session, isLoading } = useAuth();
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
            element: <ProfileForm />,
          },
          {
            path: "/guides",
            element: <GuideList />,
          },
          {
            path: "/guides/:guideId",
            element: <GuideDetail />,
          },
          {
            path: "/admin",
            element: <AdminDashboard />,
          },
        ])} />
      ) : (
        <Auth
          supabaseClient={useAuth().supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['github', 'google']}
        />
      )}
    </>
  );
}

export default App;
