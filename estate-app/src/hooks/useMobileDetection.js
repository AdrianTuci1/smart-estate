import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      // Check for mobile devices
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const tabletRegex = /ipad|android(?!.*mobile)/i;
      
      const isMobileDevice = mobileRegex.test(userAgent);
      const isTabletDevice = tabletRegex.test(userAgent);
      
      // Also check screen size as fallback
      const screenWidth = window.innerWidth;
      const isMobileScreen = screenWidth <= 768;
      
      setIsMobile(isMobileDevice || isMobileScreen);
      setIsTablet(isTabletDevice && !isMobileScreen);
    };

    checkDevice();
    
    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return { isMobile, isTablet };
};
