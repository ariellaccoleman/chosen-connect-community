
import { createContext, useContext, ReactNode, useState } from "react";

type LayoutContextType = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  pageTitle: string;
  setPageTitle: (title: string) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};

type LayoutProviderProps = {
  children: ReactNode;
};

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("");

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const value = {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    pageTitle,
    setPageTitle,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
