import { useState, useEffect } from 'react';
import { NavBarComponent, SubscriptionBlock } from './NavBarComponent';
import { useRouter } from 'next/router';
import { FaCloudUploadAlt, FaCamera, FaArrowRight, FaGraduationCap, FaBrain, FaBook, FaLightbulb, FaStar, FaRocket, FaQuestionCircle, FaCrown } from 'react-icons/fa';
import { CiHome, CiMenuBurger } from "react-icons/ci";
import Link from 'next/link';
import { BsCardHeading } from 'react-icons/bs';

export const HomeComponent = () => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
  
  const handleUploadSuccess = () => {
    setIsUploading(true);
    // Simuler un chargement progressif
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          router.push('/format-selection');
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };
  
  // Interface mobile optimisée avec des éléments de la desktop view
  const MobileView = () => (
    <div className="h-[calc(100vh-16px)] mx-2 my-2 overflow-hidden flex flex-col">
      {/* Header simplifié */}
      <div className="flex justify-between items-center px-3 py-2 bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 mb-3">
        <div className="flex items-center">
          <img src="/fayotlogo.png" alt="Logo Fayot" className="h-8" />
        </div>
        <button 
          onClick={toggleMenu} 
          className="p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-xl hover:bg-[#68ccff]/20 transition-colors duration-300"
        >
          <CiMenuBurger className="w-5 h-5" />
        </button>
      </div>

      {/* Main content - version adaptée de la desktop view */}
      <div className="bg-gradient-to-br from-[#68ccff]/10 via-[#ebebd7] to-[#68ccff]/20 rounded-2xl shadow-md border border-[#68ccff]/30 p-3 relative flex-grow flex flex-col overflow-hidden">
        {/* Éléments décoratifs minimalistes */}
        <div className="absolute -top-6 -left-6 w-20 h-20 bg-yellow-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#68ccff]/60 rounded-full opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        <div className="h-full flex flex-col relative z-10">
          {/* Deux bulles d'explication */}
          <div className="space-y-2 mb-3">
            <div className="bg-[#ebebd7] p-3 rounded-xl shadow-sm border border-[#68ccff]/30 relative">
              <div className="absolute -left-2 -top-2 w-6 h-6 bg-[#25a1e1] rounded-full flex items-center justify-center text-[#ebebd7] font-bold shadow-sm border border-[#ebebd7]">
                1
              </div>
              <h2 className="text-base font-medium text-[#106996] ml-3">
                Transforme ton cours en <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">mémo cartes</span>
              </h2>
            </div>
            
            <div className="bg-[#ebebd7] p-3 rounded-xl shadow-sm border border-[#68ccff]/30 relative">
              <div className="absolute -left-2 -top-2 w-6 h-6 bg-[#25a1e1] rounded-full flex items-center justify-center text-[#ebebd7] font-bold shadow-sm border border-[#ebebd7]">
                2
              </div>
              <h2 className="text-base font-medium text-[#106996] ml-3">
                Révise à l'aide de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">QCM sur-mesure</span>
              </h2>
            </div>
          </div>

          {/* Zone d'import simplifiée */}
          <div className="flex-grow flex flex-col">
            <div className="bg-[#ebebd7] rounded-xl border border-[#68ccff]/30 shadow-sm p-3 h-full flex flex-col">
              <div className="mb-3 text-center">
                <h3 className="text-lg font-bold text-gray-800 bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">
                  Importe ton cours
                </h3>
                <div className="inline-block mt-1 bg-[#68ccff]/10 px-2 py-1 rounded-lg text-[#106996] text-xs font-medium">
                  <FaLightbulb className="inline text-yellow-500 w-3 h-3 mr-1" />
                  Rapide & facile
                </div>
              </div>
              
              <div className="flex-grow flex flex-col justify-center items-center">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-2 space-x-4">
                    <div className="flex items-center">
                      <FaCloudUploadAlt className="text-[#25a1e1] w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">ou</span>
                    </div>
                    <div className="flex items-center">
                      <FaCamera className="text-[#25a1e1] w-5 h-5 mr-1" />
                    </div>
                  </div>
                  <p className="text-sm text-[#106996] mb-4">
                    Glisse ou sélectionne ton cours
                  </p>
                </div>
                
                {isUploading ? (
                  <div className="w-full max-w-xs">
                    <div className="w-full bg-[#68ccff]/30 rounded-full h-2">
                      <div className="bg-[#25a1e1] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-sm text-center text-[#106996] mt-2 font-medium">
                      {uploadProgress === 100 ? 'Analyse terminée !' : `Analyse en cours... ${uploadProgress}%`}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <button 
                      className="bg-[#106996] text-[#ebebd7] font-bold py-3 px-6 rounded-xl hover:bg-[#0d5475] hover:scale-105 transition-all duration-300 shadow-md border border-[#106996]/70 hover:shadow-lg"
                      onClick={handleUploadSuccess}
                    >
                      Juste ici !
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloc d'abonnement mobile */}
          <div className="mt-2">
            <SubscriptionBlock remainingCards={2} />
          </div>
        </div>
      </div>
    </div>
  );
  
  // Interface desktop réorganisée, sections empilées
  const DesktopView = () => (
    <div className="flex flex-col w-full">
      {/* Première section - Import de fichiers (100vh) */}
      <section className="min-h-screen py-6 px-6">
        <div className="h-full bg-gradient-to-br from-[#68ccff]/10 via-[#ebebd7] to-[#68ccff]/20 rounded-2xl shadow-lg border-2 border-[#68ccff]/30 p-6 relative overflow-hidden">
          {/* Éléments décoratifs */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-200 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute top-1/3 -right-16 w-32 h-32 bg-pink-200 rounded-full opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
          
          {/* Header avec titre */}
          <div className="relative z-10 mb-8 flex justify-between">
            <div className="flex items-center">
              <div className="flex items-center">
                <img src="/fayotlogo.png" alt="Logo Fayot" className="h-20 mr-4" />
                <p className="text-[#106996] font-medium text-light italic">C'est le premier de la classe <br></br> qui t'aide à réviser</p>
              </div>
            </div>

        
          </div>
          
          {/* Disposition réorganisée avec 60% gauche, 40% droite */}
          <div className="w-full flex relative z-10 h-[calc(100%-8rem)]">
            {/* Partie gauche - Colonnes divisées verticalement (60%) */}
            <div className="w-3/5 pr-6 flex flex-col justify-between">
              {/* Bulles d'explication (haut) - Simplifiées et améliorées */}
              <div className="flex space-x-6 mb-6">
                <div className="w-1/2 bg-[#ebebd7] p-5 rounded-2xl border-2 border-[#68ccff]/30 shadow-md relative flex items-center justify-center">
                  <div className="absolute -left-4 -top-4 w-10 h-10 bg-[#25a1e1] rounded-full flex items-center justify-center text-[#ebebd7] font-bold text-xl shadow-md border-2 border-[#ebebd7]">
                    1
                  </div>
                  <h2 className="text-xl font-medium text-[#106996] text-center px-2">
                    Transforme ton cours en <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">mémo cartes</span>
                  </h2>
                </div>
                
                <div className="w-1/2 bg-[#ebebd7] p-5 rounded-2xl border-2 border-[#68ccff]/30 shadow-md relative flex items-center justify-center">
                  <div className="absolute -left-4 -top-4 w-10 h-10 bg-[#25a1e1] rounded-full flex items-center justify-center text-[#ebebd7] font-bold text-xl shadow-md border-2 border-[#ebebd7]">
                    2
                  </div>
                  <h2 className="text-xl font-medium text-[#106996] text-center px-2">
                    Révise à l'aide de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">QCM sur-mesure</span>
                  </h2>
                </div>
              </div>
              
              {/* Section d'import (bas) - Version réorganisée */}
              <div className="bg-[#ebebd7] p-5 rounded-2xl border-2 border-[#68ccff]/30 shadow-md relative flex flex-col overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-[#25a1e1] to-[#106996] text-[#ebebd7] py-1 px-3 rounded-bl-xl rounded-tr-xl text-sm font-bold">
                  Facile et rapide !
                </div>
                
                <h3 className="text-2xl font-semibold text-[#106996] mb-5 text-center mt-2">
                  Importe ton cours
                </h3>
                
                <div className="flex items-center justify-center mb-5">
                  <div className="flex items-center justify-center p-3 bg-[#68ccff]/10 rounded-xl border border-[#68ccff]/30">
                    <div className="flex flex-col items-center mx-3">
                      <div className="w-12 h-12 bg-[#68ccff]/20 rounded-full flex items-center justify-center mb-2 shadow-sm">
                        <FaCloudUploadAlt className="text-[#25a1e1] w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-[#106996]">Upload</span>
                    </div>
                    <span className="text-md font-medium text-[#106996] mx-3">ou</span>
                    <div className="flex flex-col items-center mx-3">
                      <div className="w-12 h-12 bg-[#68ccff]/20 rounded-full flex items-center justify-center mb-2 shadow-sm">
                        <FaCamera className="text-[#25a1e1] w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-[#106996]">Photo</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-[#106996] text-lg mb-5 font-medium">
                  Glisse ou sélectionne ton cours
                </p>
                
                {isUploading ? (
                  <div className="w-full max-w-md mx-auto mb-4">
                    <div className="w-full bg-[#68ccff]/30 rounded-full h-3">
                      <div className="bg-[#25a1e1] h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-sm text-center text-[#106996] mt-3 font-medium">
                      {uploadProgress === 100 ? 'Analyse terminée !' : `Analyse en cours... ${uploadProgress}%`}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <button 
                      className="bg-[#106996] text-[#ebebd7] font-bold py-3 px-8 rounded-xl hover:bg-[#0d5475] hover:scale-105 transition-all duration-300 shadow-lg border border-[#106996]/70 hover:shadow-xl text-xl mb-2"
                      onClick={handleUploadSuccess}
                    >
                      Juste ici !
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Partie droite - Abonnement (40%) */}
            <div className="w-2/5 pl-6 flex flex-col justify-center">
              <div className="bg-[#ebebd7] p-6 rounded-2xl border-2 border-[#68ccff]/30 shadow-md h-full flex items-center justify-center">
                <div className="w-full h-full flex flex-col justify-center">
                  {/* Version agrandie du SubscriptionBlock avec styles personnalisés */}
                  <div className="rounded-xl bg-gradient-to-r from-[#106996] to-[#25a1e1] p-5 text-[#ebebd7] shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FaCrown className="w-6 h-6 text-yellow-400 mr-2" />
                        <span className="font-semibold text-lg">Abonnement</span>
                      </div>
                      <div className="bg-[#ebebd7]/20 px-2 py-1 rounded-lg">
                        <span className="font-bold text-yellow-300 text-lg">2/2</span>
                      </div>
                    </div>
                    
                    <p className="text-base mb-4">
                      Vous êtes limité à <span className="font-bold">2 mémo cartes</span>. Passez à l'abonnement pour une création illimitée !
                    </p>
                    
                    <div className="text-center text-2xl font-bold mb-3">9,99€<span className="text-base font-normal ml-1">/mois</span> <span className="text-base line-through opacity-75 ml-1">14,99€</span></div>
                    
                    <div className="bg-[#ebebd7]/10 rounded-lg p-3 mb-4">
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <div className="mr-2 text-green-300">✓</div>
                          <span>Mémo cartes illimitées</span>
                        </li>
                        <li className="flex items-center">
                          <div className="mr-2 text-green-300">✓</div>
                          <span>QCM personnalisés</span>
                        </li>
                        <li className="flex items-center">
                          <div className="mr-2 text-green-300">✓</div>
                          <span>Synchronisation multi-appareils</span>
                        </li>
                      </ul>
                    </div>
                    
                    <button className="w-full bg-[#ebebd7] text-[#106996] rounded-lg py-3 font-bold text-lg hover:bg-[#ebebd7]/90 transition-colors hover:scale-105 transform duration-300 shadow-md">
                      Débloquer l'illimité
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deuxième section - Informations et explications (100vh) - Version améliorée et simplifiée */}
      <section className="min-h-screen py-6 px-6">
        <div className="h-full bg-gradient-to-br from-[#68ccff]/10 via-[#ebebd7] to-[#68ccff]/20 rounded-2xl shadow-lg border-2 border-[#68ccff]/30 p-6 relative overflow-hidden">
          {/* Éléments décoratifs différents pour cette section */}
          <div className="absolute -bottom-16 left-1/3 w-48 h-48 bg-[#68ccff]/60 rounded-full opacity-30 animate-pulse" style={{ animationDelay: "2s" }}></div>
          <div className="absolute top-1/4 -left-10 w-32 h-32 bg-green-200 rounded-full opacity-30 animate-pulse" style={{ animationDelay: "1.5s" }}></div>
          
          {/* Section d'informations - Prend toute la largeur - Copywriting amélioré */}
          <div className="w-full relative z-10 h-full">
            <div className="relative bg-[#ebebd7] p-8 rounded-2xl shadow-md border-2 border-[#68ccff]/30 h-full flex flex-col justify-center">
              {/* Mascotte character */}
              <div className="absolute -top-12 -right-6 w-24 h-24">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-[#25a1e1] rounded-full w-20 h-20 shadow-lg border-4 border-[#ebebd7]"></div>
                  <div className="absolute top-[25%] left-[20%] w-4 h-4 bg-[#ebebd7] rounded-full"></div>
                  <div className="absolute top-[25%] right-[20%] w-4 h-4 bg-[#ebebd7] rounded-full"></div>
                  <div className="absolute bottom-[30%] left-[37%] w-5 h-2 bg-[#ebebd7] rounded-full"></div>
                  <div className="absolute -bottom-2 left-[40%] w-5 h-5 bg-[#25a1e1] rounded-full border-4 border-[#ebebd7]"></div>
                </div>
              </div>
              
              <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996] mb-10">
                Comment ça fonctionne ?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                <div className="bg-[#68ccff]/10 p-6 rounded-xl border border-[#68ccff]/30 shadow-md transform transition-transform hover:scale-[1.01]">
                  <div className="flex items-center text-[#106996] font-bold mb-4">
                    <BsCardHeading className="w-8 h-8 mr-4 text-[#25a1e1]" />
                    <span className="text-2xl">Mémo cartes</span>
                  </div>
                  <ul className="space-y-3 text-lg text-[#106996]">
                    <li className="flex items-start">
                      <div className="text-[#25a1e1] mr-2 font-bold">1.</div>
                      <p>Donne moi tes cours (PDF, photo ou texte)</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-[#25a1e1] mr-2 font-bold">2.</div>
                      <p>Moi, le Fayot, je vais extraire les concepts clés et créer des cartes recto-verso</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-[#25a1e1] mr-2 font-bold">3.</div>
                      <p>Tu peux réviser tes mémo cartes partout, n'importe quand</p>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-md transform transition-transform hover:scale-[1.01]">
                  <div className="flex items-center text-green-700 font-bold mb-4">
                    <FaQuestionCircle className="w-8 h-8 mr-4 text-green-600" />
                    <span className="text-2xl">QCM personnalisés</span>
                  </div>
                  <ul className="space-y-3 text-lg text-green-700">
                    <li className="flex items-start">
                      <div className="text-green-600 mr-2 font-bold">1.</div>
                      <p>Je te prépare des QCM sur-mesure</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-green-600 mr-2 font-bold">2.</div>
                      <p>J'adapte les questions à ton niveau de connaissance</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-green-600 mr-2 font-bold">3.</div>
                      <p>Tu peux réviser tes QCM partout, n'importe quand</p>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-md max-w-5xl mx-auto">
                <h3 className="text-2xl font-bold text-yellow-800 mb-4 flex items-center">
                  Pourquoi ça marche ?
                </h3>
                <p className="text-xl text-yellow-700 font-medium">
                Les études montrent que la combinaison de mémo cartes et QCM améliore la mémorisation de 80%. Moi, le Fayot, je vais analyser ton cours pour créer des mémo cartes et des QCM parfaitement adaptés à ton contenu.   <span className="font-bold"> Fini les révisions stressantes à la dernière minute !</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
  
  return (
    <div className='flex md:flex-row min-h-screen bg-gradient-to-br from-[#68ccff]/20 via-[#ebebd7] to-[#68ccff]/10'>
      {/* Navbar container - rendu sticky */}
      {!isMobile && (
        <div className="hidden md:block w-64 h-screen sticky top-0 left-0 z-50">
          <NavBarComponent />
        </div>
      )}
      
      {/* Contenu principal avec défilement */}
      <main className="flex-1 overflow-y-auto">
        {isMobile ? <MobileView /> : <DesktopView />}
        
        {/* Menu déroulant mobile */}
        {isMobile && isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="fixed top-0 right-0 h-full w-72 bg-[#ebebd7] shadow-xl z-40 rounded-l-2xl border-l-2 border-[#68ccff]/30 transform transition-all duration-300 ease-in-out translate-x-0">
              <div className="p-5 pt-16">
                <div className='mb-6 flex items-center justify-center'>
                  <img src="/fayotlogo.png" alt="Logo Fayot" className="h-10" />
                </div>
                
                <div className='flex flex-col space-y-3 mt-4'>
                  <Link 
                    href="/" 
                    className='flex items-center w-full rounded-xl px-4 py-3 transition-all duration-300 active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CiHome className="w-5 h-5 text-[#25a1e1]" />
                    <span className='ml-3 text-[16px] font-medium'>Accueil</span>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}