
import ScrollToTop from "./components/layout/ScrollToTop";
import AppRoutes from "./components/routing/AppRoutes";
import AppProviders from "./components/providers/AppProviders";
import Navbar from "./components/Navbar";
import FooterWrapper from "./components/layout/FooterWrapper";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { logger } from "./utils/logger";
import { useEffect } from "react";
import { initializeRegistry } from "./registry";

const App = () => {
  logger.info("App component rendering");
  
  // Initialize entity registry on app start, but only once
  useEffect(() => {
    try {
      initializeRegistry();
      logger.info("Entity registry initialized");
    } catch (error) {
      logger.error("Failed to initialize entity registry:", error);
    }
  }, []);
  
  return (
    <ErrorBoundary name="RootAppBoundary">
      <AppProviders>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-16">
            <ErrorBoundary name="RouteBoundary">
              <AppRoutes />
            </ErrorBoundary>
          </main>
          <FooterWrapper />
        </div>
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
