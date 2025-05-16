
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-sidebar border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-chosen-blue dark:text-chosen-blue/90 font-heading">CHOSEN</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              The premier professional network for pro-Jewish and pro-Israel professionals.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Platform</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/events" className="text-sm text-gray-500 dark:text-gray-400 hover:text-chosen-blue dark:hover:text-chosen-blue/90">Events</Link>
              </li>
              <li>
                <Link to="/organizations" className="text-sm text-gray-500 dark:text-gray-400 hover:text-chosen-blue dark:hover:text-chosen-blue/90">Organizations</Link>
              </li>
              <li>
                <Link to="/directory" className="text-sm text-gray-500 dark:text-gray-400 hover:text-chosen-blue dark:hover:text-chosen-blue/90">Community Directory</Link>
              </li>
              <li>
                <Link to="/community-guide" className="text-sm text-gray-500 dark:text-gray-400 hover:text-chosen-blue dark:hover:text-chosen-blue/90">Community Guide</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className="text-sm text-gray-500 dark:text-gray-400 hover:text-chosen-blue dark:hover:text-chosen-blue/90">About</Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-chosen-blue dark:hover:text-chosen-blue/90">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-chosen-blue dark:hover:text-chosen-blue/90">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-chosen-blue dark:hover:text-chosen-blue/90">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">&copy; {currentYear} CHOSEN Network. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
