
import ScrollToTop from "./components/layout/ScrollToTop";
import AppRoutes from "./components/routing/AppRoutes";
import AppProviders from "./components/providers/AppProviders";

const App = () => (
  <AppProviders>
    <ScrollToTop />
    <AppRoutes />
  </AppProviders>
);

export default App;
