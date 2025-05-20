
import { useLocation } from "react-router-dom";
import Footer from "../Footer";

const FooterWrapper = () => {
  const location = useLocation();
  
  // Hide footer on chat pages
  const isChatPage = location.pathname.startsWith('/chat');
  
  if (isChatPage) {
    return null;
  }
  
  return <Footer />;
};

export default FooterWrapper;
