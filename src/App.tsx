
import ScrollToTop from "./components/layout/ScrollToTop";
import AppRoutes from "./components/routing/AppRoutes";
import AppProviders from "./components/providers/AppProviders";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { logger } from "./utils/logger";

const App = () => {
  logger.info("App component rendering");
  
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
          <Footer />
        </div>
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
