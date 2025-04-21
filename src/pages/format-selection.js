import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaQuestionCircle, FaRocket, FaArrowLeft, FaCrown, FaMagic, FaBrain, FaCheck, FaStar, FaBook } from 'react-icons/fa';
import { BsCardHeading, BsQuestionCircleFill } from 'react-icons/bs';
import { CiHome, CiMenuBurger } from "react-icons/ci";
import Link from 'next/link';
import { NavBarComponent } from '../../components/NavBarComponent';

// Déplacer la fonction getFileIcon en dehors de FormatSelection
const getFileIcon = (type) => {
  switch(type) {
    case 'pdf':
      return <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">PDF</div>;
    case 'doc':
      return <div className="w-10 h-10 bg-[#68ccff]/20 rounded-full flex items-center justify-center text-[#25a1e1]">DOC</div>;
    default:
      return <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">FILE</div>;
  }
};

export default function FormatSelection() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('memo'); // Défini par défaut sur 'memo'
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoverCard, setHoverCard] = useState(null);
  const [cardCount, setCardCount] = useState(10); // Nombre de mémo cartes à générer
  const [difficultParts, setDifficultParts] = useState('');
  const [importedFile, setImportedFile] = useState({
    name: 'Document.pdf',
    type: 'pdf',
    size: '2.4 MB',
    date: '12 mai 2023'
  });
  
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
  
  const handleFormatSelect = (format) => {
    if (format === 'memo') {
      setSelectedFormat(format);
    }
    // Ignorer la sélection de 'qcm' car elle est désactivée
  };
  
  const handleLaunch = () => {
    if (!selectedFormat) return;
    
    setIsGenerating(true);
    // Simuler la génération
    setTimeout(() => {
      router.push({
        pathname: '/results',
        query: { 
          format: selectedFormat,
          cardCount: cardCount
        }
      });
    }, 2000);
  };

  // Interface mobile compact sans défilement
  const MobileView = () => (
    <div className="h-screen flex flex-col overflow-hidden p-2">
      {/* Header simplifié */}
      <div className="flex justify-between items-center px-3 py-2 bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 mb-2">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="mr-2 p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-lg hover:bg-[#68ccff]/20"
          >
            <FaArrowLeft className="w-3 h-3" />
          </button>
          <h1 className="text-lg font-bold text-[#25a1e1] flex items-center">
            <span className="mr-1">Configuration</span>
            <FaBrain className="text-yellow-500 animate-pulse w-4 h-4" />
          </h1>
        </div>
        <button 
          onClick={toggleMenu} 
          className="p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-xl hover:bg-[#68ccff]/20"
        >
          <CiMenuBurger className="w-5 h-5" />
        </button>
      </div>
      
      {/* Document importé */}
      <div className="bg-[#ebebd7] rounded-xl shadow-sm border border-[#68ccff]/30 p-2 mb-2 flex items-center">
        <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-semibold flex-shrink-0">
          PDF
        </div>
        <div className="ml-2 flex-grow overflow-hidden">
          <p className="font-semibold text-gray-800 text-sm truncate">{importedFile.name}</p>
          <p className="text-xs text-gray-500 font-light truncate">{importedFile.size} • {importedFile.date}</p>
        </div>
        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
          <FaCheck className="w-2.5 h-2.5 mr-0.5" /> Prêt
        </span>
      </div>

      {/* Contenu principal scrollable */}
      <div className="overflow-auto flex-grow mb-2 space-y-2">
        {/* Explication compacte */}
        <div className="bg-[#68ccff]/10 p-2 rounded-xl border border-[#68ccff]/30 flex items-center">
          <p className="text-xs text-[#106996] font-medium">Le Fayot va créer tes mémo cartes <span className="text-semibold">personnalisées</span></p>
        </div>
        
        {/* Choix du format */}
        <div className="bg-[#ebebd7] p-2 rounded-xl border border-[#68ccff]/30 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Format d'étude</h3>
          
          <div className="space-y-2">
            {/* Mémocards */}
            <div 
              className="border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30 rounded-lg p-2 flex items-center shadow-sm cursor-pointer"
              onClick={() => handleFormatSelect('memo')}
            >
              <div className="w-8 h-8 bg-[#68ccff]/20 rounded-full flex items-center justify-center mr-2">
                <BsCardHeading className="w-4 h-4 text-[#25a1e1]" />
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-semibold text-gray-800">mémo cartes</h4>
                <p className="text-xs text-gray-600 font-medium">Pour réviser efficacement</p>
              </div>
              <div className="w-5 h-5 bg-[#25a1e1] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#ebebd7]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* QCM désactivé */}
            <div className="border border-gray-200 rounded-lg p-2 flex items-center opacity-60 cursor-not-allowed relative">
              <div className="absolute inset-0 bg-[#ebebd7] bg-opacity-30 rounded-lg flex items-center justify-center z-10">
                <div className="bg-gray-800 bg-opacity-60 text-[#ebebd7] text-xs py-0.5 px-1.5 rounded font-medium text-[10px]">
                  Bientôt
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                <BsQuestionCircleFill className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500">QCM</h4>
                <p className="text-xs text-gray-400 font-medium">Teste tes connaissances</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Nombre de mémo cartes */}
        <div className="bg-[#ebebd7] border border-[#68ccff]/30 rounded-xl p-2 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Nombre de mémo cartes</h3>
            <span className="bg-[#68ccff]/20 text-[#106996] text-xs font-medium px-2 py-0.5 rounded">{cardCount}</span>
          </div>
          
          <input 
            type="range" 
            min="5" 
            max="30" 
            step="5" 
            value={cardCount} 
            onChange={(e) => setCardCount(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#25a1e1]"
          />
          
          <div className="flex justify-between mt-1 px-0">
            <span className="text-[10px] text-gray-400 font-light">5</span>
            <span className="text-[10px] text-gray-400 font-light">10</span>
            <span className="text-[10px] text-gray-400 font-light">15</span>
            <span className="text-[10px] text-gray-400 font-light">20</span>
            <span className="text-[10px] text-gray-400 font-light">25</span>
            <span className="text-[10px] text-gray-400 font-light">30</span>
          </div>
        </div>
        
        {/* Options */}
        <div className="bg-[#ebebd7] p-2 rounded-xl shadow-sm border border-[#68ccff]/30">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
            <FaStar className="text-yellow-500 mr-1 w-3 h-3" />
            Options
          </h3>
          
          <div className="space-y-2">
            <div className="bg-[#68ccff]/10 p-2 rounded-lg border border-[#68ccff]/30 flex items-center justify-between">
              <h4 className="font-medium text-[#106996] flex items-center text-xs">
                <FaMagic className="text-[#25a1e1] mr-1 w-3 h-3" />
                Inclure des exemples
              </h4>
              <div className="relative inline-block w-8 align-middle select-none">
                <input type="checkbox" name="toggle" id="includeExamples-mobile" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-[#ebebd7] border-4 border-gray-300 appearance-none cursor-pointer" />
                <label htmlFor="includeExamples-mobile" className="toggle-label block overflow-hidden h-4 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
            
            <div className="bg-green-50 p-2 rounded-lg border border-green-100 flex items-center justify-between">
              <h4 className="font-medium text-green-800 flex items-center text-xs">
                <FaBook className="text-green-600 mr-1 w-3 h-3" />
                Inclure des références
              </h4>
              <div className="relative inline-block w-8 align-middle select-none">
                <input type="checkbox" name="toggle" id="includeReferences-mobile" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-[#ebebd7] border-4 border-gray-300 appearance-none cursor-pointer" />
                <label htmlFor="includeReferences-mobile" className="toggle-label block overflow-hidden h-4 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bouton Générer fixé en bas */}
      <button
        className={`bg-[#25a1e1] text-[#ebebd7] py-3 px-3 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center
          ${isGenerating ? 'opacity-90' : 'hover:bg-[#106996] hover:shadow-xl'}`}
        disabled={isGenerating}
        onClick={handleLaunch}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#ebebd7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-semibold">Préparation en cours...</span>
          </>
        ) : (
          <>
            <FaRocket className="w-4 h-4 mr-2" />
            <span className="font-bold">Générer {cardCount} mémo cartes</span>
          </>
        )}
      </button>
    </div>
  );
  


  // Interface desktop optimisée en grid 2x2
  const DesktopView = () => (
    <div className="h-screen px-6 py-4 flex flex-col">
      {/* Header simplifié */}
      <div className="flex items-center mb-4">
        <button 
          onClick={() => router.back()}
          className="mr-4 p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-lg hover:bg-[#68ccff]/20 transition-all duration-300 flex items-center"
        >
          <FaArrowLeft className="w-3 h-3 mr-1" />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <h1 className="text-xl font-bold text-[#25a1e1] flex items-center">
          <span className="mr-2">Configuration</span>
        </h1>
      </div>
      
      {/* Fichier importé - compact */}
      <div className="bg-[#ebebd7] p-3 rounded-xl shadow-md border border-[#68ccff]/30 mb-6">
        <div className="flex items-center">
          {getFileIcon(importedFile.type)}
          <div className="ml-3">
            <p className="font-semibold text-gray-800">{importedFile.name}</p>
            <p className="text-sm text-gray-500 font-light">{importedFile.size} • {importedFile.date}</p>
          </div>
          <div className="ml-auto">
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full flex items-center">
              <FaCheck className="w-3 h-3 mr-1" /> Prêt
            </span>
          </div>
        </div>
      </div>
      
      {/* Grid 2x2 pour les 4 catégories principales */}
      <div className="grid grid-cols-2 gap-6 flex-grow">
        {/* Format */}
        <div className="bg-[#ebebd7] p-4 rounded-xl shadow-md border border-[#68ccff]/30">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Format d'étude</h2>
          
          <div 
            className="border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30 rounded-xl p-4 shadow-md flex items-center cursor-pointer"
            onClick={() => handleFormatSelect('memo')}
          >
            <div className="w-12 h-12 bg-[#68ccff]/20 rounded-full flex items-center justify-center mr-4 shadow-sm">
              <BsCardHeading className="w-6 h-6 text-[#25a1e1]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">mémo cartes</h3>
              <p className="text-sm text-gray-600 font-medium">Parfaites pour réviser efficacement</p>
            </div>
            <div className="ml-auto">
              <div className="w-6 h-6 bg-[#25a1e1] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#ebebd7]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-xl p-4 shadow-sm flex items-center opacity-60 cursor-not-allowed relative mt-4">
            <div className="absolute inset-0 bg-[#ebebd7] bg-opacity-30 rounded-xl flex items-center justify-center z-10">
              <div className="bg-gray-800 bg-opacity-60 text-[#ebebd7] text-xs py-1 px-2 rounded font-medium">
                Bientôt disponible
              </div>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 shadow-sm">
              <BsQuestionCircleFill className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-500">QCM</h3>
              <p className="text-sm text-gray-400 font-medium">Teste tes connaissances</p>
            </div>
          </div>
        </div>
        
        {/* Nombre de mémo cartes */}
        <div className="bg-[#ebebd7] p-4 rounded-xl shadow-md border border-[#68ccff]/30">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Nombre de mémo cartes</h2>
          
          <div className="mb-6">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Peu de cartes</span>
                <span className="text-lg font-bold text-[#25a1e1]">{cardCount}</span>
                <span className="text-sm text-gray-500 font-medium">Beaucoup de cartes</span>
              </div>
              
              <input 
                type="range" 
                min="5" 
                max="30" 
                step="5" 
                value={cardCount} 
                onChange={(e) => setCardCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#25a1e1]"
              />
            </div>
            
            <div className="flex justify-between px-1">
              <span className="text-xs text-gray-500 font-medium">5</span>
              <span className="text-xs text-gray-500 font-medium">10</span>
              <span className="text-xs text-gray-500 font-medium">15</span>
              <span className="text-xs text-gray-500 font-medium">20</span>
              <span className="text-xs text-gray-500 font-medium">25</span>
              <span className="text-xs text-gray-500 font-medium">30</span>
            </div>
          </div>
        </div>
        
        {/* Options supplémentaires (simplifié) */}
        <div className="bg-[#ebebd7] p-4 rounded-xl shadow-md border border-[#68ccff]/30">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <FaStar className="text-yellow-500 mr-2 w-4 h-4" />
            Options
          </h2>
          
          <div className="space-y-3">
            <div className="bg-[#68ccff]/10 p-3 rounded-lg border border-[#68ccff]/30">
              <h3 className="font-semibold text-[#106996] flex items-center text-sm mb-1">
                <FaMagic className="text-[#25a1e1] mr-2 w-4 h-4" />
                Inclure des exemples
              </h3>
              <div className="flex justify-end">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input type="checkbox" name="toggle" id="includeExamples" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-[#ebebd7] border-4 border-gray-300 appearance-none cursor-pointer" />
                  <label htmlFor="includeExamples" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <h3 className="font-semibold text-green-800 flex items-center text-sm mb-1">
                <FaBook className="text-green-600 mr-2 w-4 h-4" />
                Inclure des références
              </h3>
              <div className="flex justify-end">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input type="checkbox" name="toggle" id="includeReferences" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-[#ebebd7] border-4 border-gray-300 appearance-none cursor-pointer" />
                  <label htmlFor="includeReferences" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Générer */}
        <div className="bg-[#ebebd7] p-4 rounded-xl shadow-md border border-[#68ccff]/30 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Points difficiles</h2>
          
          <textarea
            placeholder="Précise les concepts, définitions ou thèmes qui te posent problème (optionnel)"
            value={difficultParts}
            onChange={(e) => setDifficultParts(e.target.value)}
            className="flex-grow text-sm p-3 border border-gray-200 rounded-lg outline-none mb-4 font-medium"
            rows="3"
          />
          
          <button
            className={`bg-[#25a1e1] text-[#ebebd7] font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg w-full flex items-center justify-center
              ${isGenerating ? 'opacity-90' : 'hover:bg-[#106996]'}`}
            disabled={isGenerating}
            onClick={handleLaunch}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#ebebd7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-semibold">Préparation en cours...</span>
              </>
            ) : (
              <>
                <FaRocket className="w-5 h-5 mr-3" />
                <span className="font-bold">Générer {cardCount} mémo cartes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='flex flex-col md:flex-row h-screen bg-gradient-to-br from-[#68ccff]/20 via-[#ebebd7] to-[#68ccff]/10 overflow-hidden'>
      {!isMobile && <NavBarComponent/>}
      <div className="flex-1 overflow-auto">
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
                  <h1 className='text-xl text-[#25a1e1] font-bold'>Fayot</h1>
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
      </div>
    </div>
  );
}