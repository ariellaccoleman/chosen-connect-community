
import ScrollToTop from "./components/layout/ScrollToTop";
import AppRoutes from "./components/routing/AppRoutes";
import AppProviders from "./components/providers/AppProviders";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const App = () => (
  <AppProviders>
    <ScrollToTop />
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  </AppProviders>
);

export default App;
