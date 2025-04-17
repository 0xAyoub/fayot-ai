import { CiHome, CiMenuBurger, CiSettings, CiUser } from "react-icons/ci";
import { FaBrain, FaBook, FaGraduationCap, FaRegCreditCard, FaCrown, FaBookmark } from 'react-icons/fa';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export const NavBarComponent = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
   
    // Mobile top bar only
    if (isMobile) {
        return (
            <>
                {/* Mobile Top Bar - design amélioré */}
                <div className='fixed top-0 left-0 right-0 flex justify-between items-center p-3 bg-white z-30 shadow-md'>
                    <h1 className='text-xl text-blue-600 font-bold flex items-center'>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md mr-2 border-2 border-white">
                            F
                        </div>
                        <span className="mr-1">Fayot</span>
                        <FaBrain className="text-yellow-500 w-4 h-4 animate-pulse" />
                    </h1>
                    <button onClick={toggleMenu} className="text-blue-600 p-2 bg-blue-50 rounded-xl shadow-sm hover:bg-blue-100 transition-colors duration-300">
                        <CiMenuBurger className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Slide-out menu for mobile with improved animation */}
                {isMenuOpen && (
                    <>
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <div 
                            className="fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-40 transform transition-all duration-300 ease-in-out rounded-l-2xl border-l-2 border-blue-100"
                            style={{ 
                                transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                                transition: 'transform 0.3s ease-in-out'
                            }}
                        >
                            <div className="p-5 pt-16 flex flex-col h-full">
                                <div className='mb-6 flex items-center justify-center'>
                                    <h1 className='text-xl text-blue-600 font-bold flex items-center'>
                                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md mr-2 border-2 border-white">
                                            F
                                        </div>
                                        <span className="mr-1">Fayot</span>
                                        <FaBrain className="text-yellow-500 w-5 h-5 animate-pulse" />
                                    </h1>
                                </div>
                                
                                <div className='flex flex-col space-y-2'>
                                    <h2 className="text-xs uppercase text-gray-500 font-semibold ml-2 mb-1">Menu principal</h2>
                                    <Link 
                                        href="/" 
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-blue-100 hover:bg-blue-50 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <CiHome className="w-5 h-5 text-blue-500" />
                                        <span className='ml-3 text-[16px] font-medium'>Accueil</span>
                                    </Link>
                                    
                                    <Link 
                                        href="/mes-cours" 
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-blue-100 hover:bg-blue-50 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaBook className="w-5 h-5 text-blue-500" />
                                        <span className='ml-3 text-[16px] font-medium'>Mes cours</span>
                                    </Link>
                                    
                                    <Link 
                                        href="/mes-cartes" 
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-blue-100 hover:bg-blue-50 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaBookmark className="w-5 h-5 text-blue-500" />
                                        <span className='ml-3 text-[16px] font-medium'>Mes cartes mémos</span>
                                    </Link>
                                </div>
                                
                                {/* Spacer to push to bottom */}
                                <div className="flex-grow"></div>
                                
                                {/* Divider */}
                                <div className="border-t border-gray-200 my-4"></div>
                                
                                {/* Secondary links */}
                                <div className='flex flex-col space-y-2 mb-4'>
                                    <h2 className="text-xs uppercase text-gray-500 font-semibold ml-2 mb-1">Paramètres</h2>
                                    <Link 
                                        href="/compte" 
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-blue-100 hover:bg-blue-50 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <CiUser className="w-5 h-5 text-gray-600" />
                                        <span className='ml-3 text-[16px] font-medium text-gray-700'>Compte</span>
                                    </Link>
                                    
                                    <Link 
                                        href="/parametres" 
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-blue-100 hover:bg-blue-50 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <CiSettings className="w-5 h-5 text-gray-600" />
                                        <span className='ml-3 text-[16px] font-medium text-gray-700'>Paramètres</span>
                                    </Link>
                                </div>
                                
                                {/* Premium subscription block */}
                                <div className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 p-4 text-white shadow-lg mb-4">
                                    <div className="flex items-center mb-2">
                                        <FaCrown className="w-5 h-5 text-yellow-400 mr-2" />
                                        <span className="font-semibold">Fayot Plus</span>
                                    </div>
                                    <p className="text-sm mb-3">Accédez à des fonctionnalités exclusives et illimitées.</p>
                                    <div className="text-center text-xl font-bold mb-2">9€<span className="text-sm font-normal">/mois</span></div>
                                    <button className="w-full bg-white text-purple-700 rounded-lg py-2 font-medium hover:bg-purple-50 transition-colors">
                                        S'abonner
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                
                {/* Content padding for fixed top bar */}
                <div className='pt-14'></div>
            </>
        );
    }
    
    // Desktop sidebar
    return (
        <div className='nav-container hidden md:flex sticky top-0 w-64 border-r-2 border-blue-100 flex-col h-[calc(100vh-24px)] bg-white m-3 rounded-2xl shadow-lg overflow-hidden'>
            {/* Main content - top section */}
            <div className='flex flex-col w-full px-5 py-5 h-full'>
                <div className='mb-5 flex items-center justify-center'>
                    <h1 className='text-2xl text-blue-600 font-bold flex items-center'>
                        <span className="mr-2">Fayot</span>
                        <FaBrain className="text-yellow-500 w-5 h-5 animate-pulse" />
                    </h1>
                </div>
                
                <div className='flex flex-col space-y-1.5'>
                    <Link 
                        href="/" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-blue-50 hover:scale-105`}
                    >
                        <CiHome className="w-5 h-5 text-blue-500" />
                        <span className='ml-3 text-[16px] font-medium'>Accueil</span>
                    </Link>

                    <Link 
                        href="/mes-cours" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-blue-50 hover:scale-105`}
                    >
                        <FaBook className="w-5 h-5 text-blue-500" />
                        <span className='ml-3 text-[16px] font-medium'>Mes cours</span>
                    </Link>
                    
                    <Link 
                        href="/mes-cartes" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-blue-50 hover:scale-105`}
                    >
                        <FaBookmark className="w-5 h-5 text-blue-500" />
                        <span className='ml-3 text-[16px] font-medium'>Mes cartes mémos</span>
                    </Link>
                </div>
                
                {/* Spacer to push the bottom content down */}
                <div className="flex-grow"></div>
                    
                {/* Secondary links */}
                <div className='flex flex-col space-y-1.5 mt-4 mb-4'>
                    <Link 
                        href="/compte" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-blue-50 hover:scale-105`}
                    >
                        <CiUser className="w-5 h-5 text-gray-600" />
                        <span className='ml-3 text-[16px] font-medium text-gray-700'>Compte</span>
                    </Link>
                    
                    <Link 
                        href="/parametres" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-blue-50 hover:scale-105`}
                    >
                        <CiSettings className="w-5 h-5 text-gray-600" />
                        <span className='ml-3 text-[16px] font-medium text-gray-700'>Paramètres</span>
                    </Link>
            </div>

                {/* Premium subscription block */}
                <div className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 p-4 text-white shadow-lg mb-6">
                    <div className="flex items-center mb-2">
                        <FaCrown className="w-5 h-5 text-yellow-400 mr-2" />
                        <span className="font-semibold">Fayot Plus</span>
                    </div>
                    <p className="text-sm mb-3">Accédez à des fonctionnalités exclusives et illimitées.</p>
                    <div className="text-center text-xl font-bold mb-2">9€<span className="text-sm font-normal">/mois</span></div>
                    <button className="w-full bg-white text-purple-700 rounded-lg py-2 font-medium hover:bg-purple-50 transition-colors">
                        S'abonner
                        </button>
                </div>
            </div>
        </div>
    );
}