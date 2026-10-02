
import { useState, useEffect } from 'react';

const getIsTablet = () => typeof window !== 'undefined' && window.innerWidth > 640 && window.innerWidth <= 1225;

export const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(getIsTablet());

  useEffect(() => {
    const onResize = () => {
      setIsTablet(getIsTablet());
    };

    window.addEventListener('resize', onResize);
    
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);
    
  return isTablet;
};