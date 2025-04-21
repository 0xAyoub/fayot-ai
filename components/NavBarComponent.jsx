import { FaHome, FaBook, FaBookmark, FaUserAlt, FaCog, FaBars, FaCrown } from 'react-icons/fa';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export const SubscriptionBlock = ({remainingCards = 2}) => (
    <div className="rounded-xl bg-gradient-to-r from-[#106996] to-[#25a1e1] p-4 text-[#ebebd7] shadow-lg">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
                <FaCrown className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="font-semibold">Fayot Plus</span>
            </div>
            <div className="bg-[#ebebd7]/20 px-2 py-1 rounded-lg">
                <span className="font-bold text-yellow-300">{remainingCards}/2</span>
            </div>
        </div>
        
        <p className="text-sm mb-3">
            Vous êtes limité à <span className="font-bold">2 mémo cartes</span>. Passez à Fayot Plus pour une création illimitée !
        </p>
        
        <div className="text-center text-xl font-bold mb-2">9,99€<span className="text-sm font-normal">/mois</span> <span className="text-sm line-through opacity-75">14,99€</span></div>
        <button className="w-full bg-[#ebebd7] text-[#106996] rounded-lg py-2 font-medium hover:bg-[#ebebd7]/90 transition-colors">
            Débloquer l'illimité
        </button>
    </div>
);

export const NavBarComponent = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [remainingCards, setRemainingCards] = useState(2); // Nombre de mémo cartes restantes
    
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
                {/* Logo au-dessus de la navbar pour mobile */}
                <div className='flex justify-center py-2 bg-[#ebebd7] shadow-sm'>
                    <img src="/fayotlogo.png" alt="Logo Fayot" className="h-10" />
                </div>
                
                {/* Mobile Top Bar - design amélioré */}
                <div className='fixed top-0 left-0 right-0 flex justify-between items-center p-3 bg-[#ebebd7] z-30 shadow-md'>
                    <div className='text-xl font-bold'>
                        {/* Espace vide à gauche pour équilibrer */}
                    </div>
                    <button onClick={toggleMenu} className="text-[#25a1e1] p-2 bg-[#68ccff]/10 rounded-xl shadow-sm hover:bg-[#68ccff]/20 transition-colors duration-300">
                        <FaBars className="w-5 h-5" />
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
                            className="fixed top-0 right-0 h-full w-72 bg-[#ebebd7] shadow-xl z-40 transform transition-all duration-300 ease-in-out rounded-l-2xl border-l-2 border-[#68ccff]/30"
                            style={{ 
                                transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                                transition: 'transform 0.3s ease-in-out'
                            }}
                        >
                            <div className="p-5 pt-16 flex flex-col h-full">
                                <div className='mb-6 flex items-center justify-center'>
                                    <img src="/fayotlogo.png" alt="Logo Fayot" className="h-12" />
                                </div>
                                
                                <div className='flex flex-col space-y-2'>
                                    <h2 className="text-xs uppercase text-gray-500 font-semibold ml-2 mb-1">Menu principal</h2>
                                    <Link 
                                        href="/" 
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaHome className="w-5 h-5 text-[#25a1e1]" />
                                        <span className='ml-3 text-[16px] font-medium'>Accueil</span>
                                    </Link>
                                    
                                    <Link 
                                        href="/mes-cours" 
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaBook className="w-5 h-5 text-[#25a1e1]" />
                                        <span className='ml-3 text-[16px] font-medium'>Mes cours</span>
                                    </Link>
                                    
                                    <Link 
                                        href="/mes-cartes" 
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaBookmark className="w-5 h-5 text-[#25a1e1]" />
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
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaUserAlt className="w-5 h-5 text-gray-600" />
                                        <span className='ml-3 text-[16px] font-medium text-gray-700'>Compte</span>
                                    </Link>
                                    
                                    <Link 
                                        href="/parametres" 
                                        className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaCog className="w-5 h-5 text-gray-600" />
                                        <span className='ml-3 text-[16px] font-medium text-gray-700'>Paramètres</span>
                                    </Link>
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
        <div className='nav-container hidden md:flex sticky top-0 w-64 border-r-2 border-[#68ccff]/30 flex-col h-[calc(100vh-24px)] bg-[#ebebd7] m-3 rounded-2xl shadow-lg overflow-hidden'>
            {/* Main content - top section */}
            <div className='flex flex-col w-full px-5 py-5 h-full'>
                {/* Logo à droite et agrandi */}
                <div className='mb-5 flex justify-center'>
                    <img src="/fayotlogo.png" alt="Logo Fayot" className="h-18" />
                </div>
                
                <div className='flex flex-col space-y-1.5'>
                    <Link 
                        href="/" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-[#68ccff]/10 hover:scale-105`}
                    >
                        <FaHome className="w-5 h-5 text-[#25a1e1]" />
                        <span className='ml-3 text-[16px] font-medium'>Accueil</span>
                    </Link>

                    <Link 
                        href="/mes-cours" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-[#68ccff]/10 hover:scale-105`}
                    >
                        <FaBook className="w-5 h-5 text-[#25a1e1]" />
                        <span className='ml-3 text-[16px] font-medium'>Mes cours</span>
                    </Link>
                    
                    <Link 
                        href="/mes-cartes" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-[#68ccff]/10 hover:scale-105`}
                    >
                        <FaBookmark className="w-5 h-5 text-[#25a1e1]" />
                        <span className='ml-3 text-[16px] font-medium'>Mes cartes mémos</span>
                    </Link>
                </div>
                
                {/* Spacer to push the bottom content down */}
                <div className="flex-grow"></div>
                    
                {/* Secondary links */}
                <div className='flex flex-col space-y-1.5 mt-4 mb-4'>
                    <Link 
                        href="/compte" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-[#68ccff]/10 hover:scale-105`}
                    >
                        <FaUserAlt className="w-5 h-5 text-gray-600" />
                        <span className='ml-3 text-[16px] font-medium text-gray-700'>Compte</span>
                    </Link>
                    
                    <Link 
                        href="/parametres" 
                        className={`flex items-center w-full rounded-xl px-4 py-2.5 transition-all hover:bg-[#68ccff]/10 hover:scale-105`}
                    >
                        <FaCog className="w-5 h-5 text-gray-600" />
                        <span className='ml-3 text-[16px] font-medium text-gray-700'>Paramètres</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}