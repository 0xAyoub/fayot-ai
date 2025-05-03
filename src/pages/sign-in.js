import { useState, useEffect } from 'react';
import { SignInComponent } from '../../components/SignInComponent';
import { NavBarComponent } from '../../components/NavBarComponent';

export default function SignIn() {
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return (
    <div className='flex flex-col md:flex-row h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden'>
      <div className="flex-1 overflow-auto">
        <SignInComponent />
      </div>
    </div>
  );
}


