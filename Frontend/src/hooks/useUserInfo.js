import { useState, useEffect } from 'react';
/**
 * Custom hook to manage user info from localStorage
 * @returns {Object} userInfo - The parsed user info object or null
 */
const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState(null);
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
      } catch (error) {
        setUserInfo(null);
      }
    }
  }, []);
  return userInfo;
};
export default useUserInfo;
