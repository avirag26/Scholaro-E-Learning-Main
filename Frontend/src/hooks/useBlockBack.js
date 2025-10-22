import { useEffect } from 'react';

export const useBlockBack = () => {
  useEffect(() => {
    
    const preventBack = () => {
      window.history.pushState(null, '', window.location.pathname);
    };

    window.history.pushState(null, '', window.location.pathname);

   
    window.addEventListener('popstate', preventBack);

    return () => {
      window.removeEventListener('popstate', preventBack);
    };
  }, []);
};

export default useBlockBack;