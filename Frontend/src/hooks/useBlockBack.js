import { useEffect } from 'react';

export const useBlockBack = () => {
  useEffect(() => {
    // Simple back button prevention
    const preventBack = () => {
      window.history.pushState(null, '', window.location.pathname);
    };

    // Push initial state
    window.history.pushState(null, '', window.location.pathname);

    // Add event listener
    window.addEventListener('popstate', preventBack);

    return () => {
      window.removeEventListener('popstate', preventBack);
    };
  }, []);
};

export default useBlockBack;