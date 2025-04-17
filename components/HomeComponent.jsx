import { useState, useEffect } from 'react';
import { NavBarComponent } from './NavBarComponent';
import { useRouter } from 'next/router';
import { FaCloudUploadAlt, FaCamera, FaArrowRight, FaGraduationCap, FaBrain, FaBook, FaLightbulb, FaStar, FaRocket } from 'react-icons/fa';
import { CiHome, CiMenuBurger } from "react-icons/ci";
import Link from 'next/link';

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
    <div className="h-[calc(100vh-16px)] mx-2 my-2 overflow-hidden">
      {/* Header simplifié */}
      <div className="flex justify-between items-center px-3 py-2 bg-white rounded-2xl shadow-md border border-blue-100 mb-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md mr-2 border-2 border-white">
            F
          </div>
          <h1 className="text-lg font-bold text-blue-600 flex items-center">
            <span className="mr-1">Fayot</span>
            <FaBrain className="text-yellow-500 w-4 h-4 animate-pulse" />
          </h1>
        </div>
        <button 
          onClick={toggleMenu} 
          className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-300"
        >
          <CiMenuBurger className="w-5 h-5" />
        </button>
      </div>
      
      {/* Main content - version adaptée de la desktop view */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl shadow-md border border-blue-100 p-3 relative h-[calc(100%-52px)] overflow-hidden">
        {/* Éléments décoratifs minimalistes */}
        <div className="absolute -top-6 -left-6 w-20 h-20 bg-yellow-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-blue-200 rounded-full opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        <div className="h-full flex flex-col relative z-10">
          {/* Left section */}
          <div className="mb-3">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 relative">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 mb-2">
                Transforme tes cours en mémocartes !
              </h2>
              
              <p className="text-gray-700 text-sm mb-2">
                Améliore ta mémorisation. Plus besoin de passer des heures à créer des fiches !
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-start">
                  <FaRocket className="w-3 h-3 mr-1 text-indigo-600 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-indigo-600">Gain de temps</span>
                    <p className="text-xs text-indigo-700 mt-0.5">Conversion en quelques secondes</p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-2 rounded-lg border border-green-100 flex items-start">
                  <FaStar className="w-3 h-3 mr-1 text-green-600 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-green-600">Personnalisé</span>
                    <p className="text-xs text-green-700 mt-0.5">Adapté à ta façon d'apprendre</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right section - Upload options */}
          <div className="flex-grow">
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-3 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-800">
                  Importe ton cours
                </h3>
                <div className="bg-blue-50 px-2 py-1 rounded-lg text-blue-700 text-xs font-medium">
                  <FaLightbulb className="inline text-yellow-500 w-3 h-3 mr-1" />
                  Rapide & facile
                </div>
              </div>
              
              <div className="space-y-3 flex-grow flex flex-col justify-center">
                <div 
                  className="border-2 border-dashed border-blue-300 rounded-lg p-2 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer"
                  onClick={handleUploadSuccess}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center mr-3 text-blue-600 shadow-sm border-2 border-white">
                      <FaCloudUploadAlt className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold text-blue-700">Importer un fichier</h4>
                      <p className="text-xs text-blue-600">
                        PDF, Word, Images
                      </p>
                      
                      {isUploading && (
                        <div className="w-full mt-1">
                          <div className="w-full bg-blue-200 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-grow h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                  <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mx-2">OU</div>
                  <div className="flex-grow h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                </div>
                
                <div 
                  className="border-2 border-dashed border-indigo-300 rounded-lg p-2 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 cursor-pointer"
                  onClick={handleUploadSuccess}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center mr-3 text-indigo-600 shadow-sm border-2 border-white">
                      <FaCamera className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold text-indigo-700">Prendre une photo</h4>
                      <p className="text-xs text-indigo-600">
                        De ton cours ou tes notes
                      </p>
                      
                      {isUploading && (
                        <div className="w-full mt-1">
                          <div className="w-full bg-indigo-200 rounded-full h-1.5">
                            <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Interface desktop simplifiée
  const DesktopView = () => (
    <div className="h-[calc(100vh-24px)] mx-3 mt-3">
      <div className="h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl shadow-lg border-2 border-blue-100 p-6 relative overflow-hidden">
        {/* Éléments décoratifs cartoon */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-1/3 -right-16 w-32 h-32 bg-pink-200 rounded-full opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute -bottom-16 left-1/3 w-48 h-48 bg-blue-200 rounded-full opacity-30 animate-pulse" style={{ animationDelay: "2s" }}></div>
        
        {/* Header avec mascotte */}
        <div className="relative z-10 mb-8 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md transform rotate-3 mr-4 border-2 border-white">
              F
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-600 flex items-center">
                <span className="mr-2">Fayot</span>
                <FaBrain className="text-yellow-500 w-6 h-6 animate-pulse" />
              </h1>
              <p className="text-indigo-500 font-medium">Ton partenaire d'études intelligent</p>
            </div>
          </div>

          <div className="flex items-center bg-blue-50 px-4 py-2 rounded-xl shadow border border-blue-100">
            <FaLightbulb className="text-yellow-500 w-5 h-5 mr-2" />
            <p className="text-sm font-medium text-blue-700">Crée des mémocartes en un clic !</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 relative z-10 h-[calc(100%-8rem)]">
          {/* Left section - Mascot and info */}
          <div className="w-full lg:w-1/2 pr-0 lg:pr-8">
            <div className="relative bg-white p-6 rounded-2xl shadow-md border-2 border-blue-100 h-full transform hover:scale-[1.01] transition-all duration-300">
              {/* Mascotte character */}
              <div className="absolute -top-12 -right-6 w-24 h-24">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-blue-500 rounded-full w-20 h-20 shadow-lg border-4 border-white"></div>
                  <div className="absolute top-[25%] left-[20%] w-4 h-4 bg-white rounded-full"></div>
                  <div className="absolute top-[25%] right-[20%] w-4 h-4 bg-white rounded-full"></div>
                  <div className="absolute bottom-[30%] left-[37%] w-5 h-2 bg-white rounded-full"></div>
                  <div className="absolute -bottom-2 left-[40%] w-5 h-5 bg-blue-500 rounded-full border-4 border-white"></div>
                </div>
              </div>
              
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 mb-4">
                Transforme tes cours en mémocartes !
              </h2>
              
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                Améliore ta mémorisation et tes révisions. Plus besoin de passer des heures à créer des fiches, Fayot s'en occupe pour toi !
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 shadow-sm transform transition-transform hover:scale-105">
                  <div className="flex items-center text-indigo-600 font-bold mb-1">
                    <FaRocket className="w-4 h-4 mr-2" />
                    <span>Gain de temps</span>
                  </div>
                  <p className="text-sm text-indigo-700">Transforme ton cours en mémocartes en quelques secondes</p>
                </div>
                
                <div className="bg-green-50 p-3 rounded-xl border border-green-100 shadow-sm transform transition-transform hover:scale-105">
                  <div className="flex items-center text-green-600 font-bold mb-1">
                    <FaStar className="w-4 h-4 mr-2" />
                    <span>Personnalisé</span>
                  </div>
                  <p className="text-sm text-green-700">Des mémocartes adaptées à ton cours et à ta façon d'apprendre</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-4 shadow-sm">
                <div className="flex items-start">
                  <FaBrain className="text-yellow-600 w-5 h-5 mr-3 flex-shrink-0 mt-1" />
                  <p className="text-yellow-800">
                    <span className="font-bold">Le savais-tu ?</span> 80% des étudiants améliorent leur rétention d'information grâce aux mémocartes. Fayot les génère automatiquement à partir de ton cours !
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right section - Upload options */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-md flex-grow relative h-full flex flex-col overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-500 to-blue-400 text-white py-1 px-3 rounded-bl-xl rounded-tr-xl text-sm font-medium">
                Facile et rapide !
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-4 mt-3 text-center">
                Importe ton cours
              </h3>
              
              <div className="space-y-3 flex-grow flex flex-col justify-center overflow-auto">
                <div 
                  className="border-2 border-dashed border-blue-300 rounded-xl p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer shadow-md"
                  onClick={handleUploadSuccess}
                >
                  <div className="flex flex-col sm:flex-row items-center">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 bg-blue-200 rounded-full flex items-center justify-center mb-2 sm:mb-0 sm:mr-4 text-blue-600 shadow-md border-2 border-white flex-shrink-0">
                      <FaCloudUploadAlt className="w-7 h-7 lg:w-8 lg:h-8" />
                    </div>
                    
                    <div className="flex-grow text-center sm:text-left">
                      <h4 className="text-lg font-bold text-blue-700 mb-1">Importer un fichier</h4>
                      <p className="text-blue-600 text-sm mb-2">
                        Glisse ou sélectionne un document
                      </p>
                      
                      {isUploading ? (
                        <div className="w-full">
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                          <p className="text-xs text-center text-blue-700 mt-1 font-medium">
                            {uploadProgress === 100 ? 'Analyse terminée !' : `Analyse en cours... ${uploadProgress}%`}
                          </p>
                        </div>
                      ) : (
                        <button 
                          className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-md border border-blue-700 hover:shadow-lg text-sm"
                          onClick={handleUploadSuccess}
                        >
                          Sélectionner un fichier
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-grow h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mx-4">OU</div>
                  <div className="flex-grow h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                </div>
                
                <div 
                  className="border-2 border-dashed border-indigo-300 rounded-xl p-3 lg:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 cursor-pointer shadow-md"
                  onClick={handleUploadSuccess}
                >
                  <div className="flex flex-col sm:flex-row items-center">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 bg-indigo-200 rounded-full flex items-center justify-center mb-2 sm:mb-0 sm:mr-4 text-indigo-600 shadow-md border-2 border-white flex-shrink-0">
                      <FaCamera className="w-7 h-7 lg:w-8 lg:h-8" />
                    </div>
                    
                    <div className="flex-grow text-center sm:text-left">
                      <h4 className="text-lg font-bold text-indigo-700 mb-1">Prendre une photo</h4>
                      <p className="text-indigo-600 text-sm mb-2">
                        Photographie ton cours ou tes notes
                      </p>
                      
                      {isUploading ? (
                        <div className="w-full">
                          <div className="w-full bg-indigo-200 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                          <p className="text-xs text-center text-indigo-700 mt-1 font-medium">
                            {uploadProgress === 100 ? 'Analyse terminée !' : `Analyse en cours... ${uploadProgress}%`}
                          </p>
                        </div>
                      ) : (
                        <button 
                          className="bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 hover:scale-105 transition-all duration-300 shadow-md border border-indigo-700 hover:shadow-lg text-sm"
                          onClick={handleUploadSuccess}
                        >
                          Ouvrir l'appareil photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className='flex flex-col md:flex-row h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 overflow-hidden'>
      {!isMobile && <NavBarComponent/>}
      <div className="flex-1 overflow-hidden">
        {isMobile ? <MobileView /> : <DesktopView />}
        
        {/* Menu déroulant mobile */}
        {isMobile && isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-40 rounded-l-2xl border-l-2 border-blue-100 transform transition-all duration-300 ease-in-out translate-x-0">
              <div className="p-5 pt-16">
                <div className='mb-6 flex items-center justify-center'>
                  <h1 className='text-xl text-blue-600 font-bold'>Fayot</h1>
                </div>
                
                <div className='flex flex-col space-y-3 mt-4'>
                  <Link 
                    href="/" 
                    className='flex items-center w-full rounded-xl px-4 py-3 transition-all duration-300 active:bg-blue-100 hover:bg-blue-50 hover:scale-105'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CiHome className="w-5 h-5 text-blue-500" />
                    <span className='ml-3 text-[16px] font-medium'>Accueil</span>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}