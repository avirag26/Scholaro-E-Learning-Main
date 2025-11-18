import { useLocation } from 'react-router-dom';
import Header from '../../Pages/USER/Common/Header';
import PublicHeader from '../../Pages/USER/Common/PublicHeader';
import Footer from '../Common/Footer';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const PublicLayout = ({ children, showSidebar = false, onMenuClick }) => {
  const location = useLocation();
  const { isAuthenticated } = useCurrentUser();
  
  // Check if we're on a public route (starts with /browse)
  const isPublicRoute = location.pathname.startsWith('/browse');
  
  // Use public header for all public routes (regardless of authentication status)
  const shouldUsePublicHeader = isPublicRoute;

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldUsePublicHeader ? (
        <PublicHeader onMenuClick={showSidebar ? onMenuClick : null} />
      ) : (
        <Header onMenuClick={showSidebar ? onMenuClick : null} />
      )}
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default PublicLayout;