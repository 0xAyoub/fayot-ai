import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaCheck, FaRedo, FaDownload, FaShareAlt, FaMagic, FaTrophy, FaRocket, FaSync, FaBrain, FaBookmark, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CiHome, CiMenuBurger } from "react-icons/ci";
import Link from 'next/link';
import { NavBarComponent } from '../../components/NavBarComponent';
import { withAuth } from '../hoc/withAuth';

// Exemples de mémo cartes générées
const SAMPLE_CARDS = [
  {
    id: 1,
    question: "Qu'est-ce que la loi de Moore ?",
    answer: "La loi de Moore prédit que le nombre de transistors sur une puce double environ tous les deux ans, entraînant une augmentation exponentielle de la puissance de calcul. Cette tendance a guidé l'industrie des semi-conducteurs depuis les années 1970, bien que son rythme ralentisse aujourd'hui."
  },
  {
    id: 2,
    question: "Explique le concept d'héritage en programmation orientée objet",
    answer: "L'héritage est un principe fondamental de la POO qui permet à une classe d'acquérir les propriétés et méthodes d'une autre classe. La classe qui hérite (enfant) réutilise et peut étendre le code de la classe parent, ce qui favorise la réutilisation du code et crée une hiérarchie entre les classes."
  },
  {
    id: 3,
    question: "Qu'est-ce que le théorème de Pythagore et comment s'applique-t-il ?",
    answer: "Le théorème de Pythagore établit que dans un triangle rectangle, le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés. Soit a² + b² = c² où c est l'hypoténuse. Il permet de calculer des distances et est fondamental en géométrie, trigonométrie et dans de nombreuses applications pratiques."
  },
  {
    id: 4,
    question: "Définis le concept de photosynthèse",
    answer: "La photosynthèse est le processus par lequel les plantes, les algues et certaines bactéries convertissent l'énergie lumineuse en énergie chimique. Ils utilisent la lumière du soleil pour transformer le dioxyde de carbone et l'eau en glucose et en oxygène, fournissant ainsi l'énergie nécessaire à leur croissance."
  },
  {
    id: 5,
    question: "Qu'est-ce que la théorie de l'évolution par sélection naturelle de Darwin ?",
    answer: "La théorie de l'évolution par sélection naturelle, proposée par Charles Darwin, explique que les espèces évoluent au fil du temps en raison de variations héritables qui augmentent la survie et la reproduction des individus. Les traits avantageux deviennent plus courants dans les générations suivantes, conduisant à l'adaptation des espèces à leur environnement."
  }
];

function Results({ user }) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [memorizedCards, setMemorizedCards] = useState([]);
  const [memoCards, setMemoCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const cardRef = useRef(null);
  
  // Extraire les paramètres de la requête
  useEffect(() => {
    if (router.query.format && router.query.cardCount) {
      // Simuler le chargement des cartes générées par le Fayot
      setTimeout(() => {
        setMemoCards(SAMPLE_CARDS.slice(0, parseInt(router.query.cardCount) || 5));
        setLoadingCards(false);
      }, 1500);
    } else {
      setMemoCards(SAMPLE_CARDS);
      setLoadingCards(false);
    }
  }, [router.query]);
  
  // Vérifier si on est sur mobile
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

  // Gestion du swipe pour les mémo cartes
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNextCard();
    }
    
    if (isRightSwipe) {
      goToPrevCard();
    }
  };

  const goToNextCard = () => {
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex((prev) => (prev + 1) % memoCards.length);
      }, 150);
    } else {
      setCurrentCardIndex((prev) => (prev + 1) % memoCards.length);
    }
  };

  const goToPrevCard = () => {
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex((prev) => (prev === 0 ? memoCards.length - 1 : prev - 1));
      }, 150);
    } else {
      setCurrentCardIndex((prev) => (prev === 0 ? memoCards.length - 1 : prev - 1));
    }
  };

  const toggleFlip = () => {
    if (cardRef.current) {
      cardRef.current.classList.add('animate-flip');
      setTimeout(() => {
        setIsFlipped(!isFlipped);
        cardRef.current.classList.remove('animate-flip');
      }, 150);
    } else {
      setIsFlipped(!isFlipped);
    }
  };

  const toggleMemorized = (cardId, e) => {
    e.stopPropagation();
    setMemorizedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  };

  const restartCards = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setMemorizedCards([]);
  };

  const getCurrentCard = () => {
    return memoCards[currentCardIndex] || { question: "Chargement...", answer: "Chargement..." };
  };

  const currentCard = getCurrentCard();
  const isCurrentCardMemorized = memorizedCards.includes(currentCard.id);
  const memorizedCount = memorizedCards.length;
  const progress = memoCards.length > 0 ? (memorizedCount / memoCards.length) * 100 : 0;

  // Interface mobile (inchangée pour l'instant)
  const MobileView = () => (
    <div className='h-screen overflow-auto'>
      {/* Header compact avec bouton retour intégré */}
      <div className='flex justify-between items-center bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 transition-all duration-300 py-2 px-3 mx-2 mt-2 mb-1'>
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/format-selection')}
            className="mr-2 p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-lg hover:bg-[#68ccff]/20 transition-all duration-300"
          >
            <FaArrowLeft className="w-3 h-3" />
          </button>
          <h1 className="text-lg font-bold text-[#25a1e1] flex items-center">
            <span className="mr-2">mémo cartes</span>
          </h1>
          {/* Barre de progression intégrée */}
          <div className="ml-3 flex items-center">
            <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-1">
              <div className="bg-[#25a1e1] h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs font-medium text-gray-500">{memorizedCount}/{memoCards.length}</span>
          </div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={toggleMenu} 
            className="p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-xl hover:bg-[#68ccff]/20 transition-colors duration-300"
          >
            <CiMenuBurger className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenu principal - utilisant tout l'espace vertical restant */}
      <div className="flex-grow flex flex-col mx-2">
        {loadingCards ? (
          <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 flex-grow flex flex-col items-center justify-center p-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#25a1e1] mb-3"></div>
            <p className="text-gray-700 font-semibold">Création de tes mémo cartes...</p>
            <p className="text-xs text-gray-500 mt-1 font-light">Le Fayot prépare des mémo cartes pour ton cours</p>
          </div>
        ) : (
          <>
            {showDownload ? (
              <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 flex-grow flex flex-col p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-gray-800">Télécharge tes mémo cartes</h2>
                  <button 
                    onClick={() => setShowDownload(false)}
                    className="text-[#25a1e1] text-sm bg-[#68ccff]/10 px-2 py-1 rounded-lg hover:bg-[#68ccff]/20"
                  >
                    <FaArrowLeft className="inline w-3 h-3 mr-1" /> Retour
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="bg-[#68ccff]/10 p-3 rounded-xl border border-[#68ccff]/30 hover:shadow-md transition-all duration-300 transform hover:scale-[1.01] cursor-pointer">
                    <h3 className="font-semibold text-gray-800 mb-1">Format PDF</h3>
                    <p className="text-xs text-gray-500 mb-2 font-light">Pour imprimer ou partager facilement</p>
                    <button className="w-full bg-[#25a1e1] text-[#ebebd7] text-sm py-1.5 rounded-lg hover:bg-[#106996] transition-colors duration-300 flex items-center justify-center font-bold">
                      <FaDownload className="w-3 h-3 mr-1" /> Télécharger PDF
                    </button>
                  </div>
                  
                  <div className="bg-[#68ccff]/10 p-3 rounded-xl border border-[#68ccff]/30 hover:shadow-md transition-all duration-300 transform hover:scale-[1.01] cursor-pointer">
                    <h3 className="font-semibold text-gray-800 mb-1">Format Images</h3>
                    <p className="text-xs text-gray-500 mb-2 font-light">Pour partager sur les réseaux sociaux</p>
                    <button className="w-full bg-[#106996] text-[#ebebd7] text-sm py-1.5 rounded-lg hover:bg-[#25a1e1] transition-colors duration-300 flex items-center justify-center font-bold">
                      <FaDownload className="w-3 h-3 mr-1" /> Télécharger Images
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* mémo cartes maximisées */}
                <div className="flex-grow flex items-center justify-center">
                  <div className="perspective-1000 w-full h-[70vh] max-w-xl mx-auto"
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}>
                    <div 
                      ref={cardRef}
                      className={`relative w-full h-full rounded-2xl shadow-md cursor-pointer transition-transform duration-300 transform-style preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`} 
                      onClick={toggleFlip}
                    >
                      {/* Face avant (question) */}
                      <div className={`absolute w-full h-full backface-hidden rounded-2xl bg-[#ebebd7] border ${isCurrentCardMemorized ? 'border-green-300' : 'border-[#68ccff]/30'} p-4 flex flex-col`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="px-2 py-0.5 bg-[#68ccff]/20 text-[#106996] text-xs font-medium rounded-full">Question {currentCardIndex + 1}/{memoCards.length}</span>
                          <button 
                            className={`p-1.5 rounded-full ${isCurrentCardMemorized ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'} hover:bg-green-100 hover:text-green-500 transition-colors`}
                            onClick={(e) => toggleMemorized(currentCard.id, e)}
                          >
                            <FaBookmark className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-grow flex items-center justify-center overflow-auto">
                          <h3 className="text-xl font-bold text-gray-800 text-center">{currentCard.question}</h3>
                        </div>
                        <div className="text-center text-gray-500 text-xs mt-2 font-light italic">
                          Tape pour voir la réponse
                        </div>
                      </div>

                      {/* Face arrière (réponse) */}
                      <div className="absolute w-full h-full backface-hidden rounded-2xl bg-[#ebebd7] border border-[#68ccff]/30 p-4 flex flex-col rotate-y-180">
                        <div className="flex justify-between items-start mb-1">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Réponse {currentCardIndex + 1}/{memoCards.length}</span>
                          <button 
                            className={`p-1.5 rounded-full ${isCurrentCardMemorized ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'} hover:bg-green-100 hover:text-green-500 transition-colors`}
                            onClick={(e) => toggleMemorized(currentCard.id, e)}
                          >
                            <FaBookmark className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-grow overflow-auto p-1">
                          <p className="text-gray-700 font-light">{currentCard.answer}</p>
                        </div>
                        <div className="text-center text-gray-500 text-xs mt-2 font-light italic">
                          Tape pour revenir à la question
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation des cartes et actions */}
                <div className="py-2">
                  {/* Points indicateurs et flèches */}
                  <div className="flex justify-between items-center mb-2">
                    <button 
                      onClick={goToPrevCard}
                      className="w-10 h-10 bg-[#ebebd7] border border-[#68ccff]/30 text-[#25a1e1] rounded-full flex items-center justify-center shadow-sm hover:bg-[#68ccff]/10 transition-all duration-300"
                    >
                      <FaChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex space-x-0.5">
                      {memoCards.map((_, index) => (
                        <div 
                          key={index} 
                          className={`w-1.5 h-1.5 rounded-full ${currentCardIndex === index ? 'bg-[#25a1e1]' : 'bg-gray-300'}`}
                        />
                      ))}
                    </div>
                    
                    <button 
                      onClick={goToNextCard}
                      className="w-10 h-10 bg-[#25a1e1] text-[#ebebd7] rounded-full flex items-center justify-center shadow-md hover:bg-[#106996] transition-all duration-300"
                    >
                      <FaChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Boutons d'action */}
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="bg-[#ebebd7] border border-[#68ccff]/30 text-[#25a1e1] rounded-xl py-2 px-3 text-sm font-medium flex items-center justify-center shadow-sm hover:bg-[#68ccff]/10"
                      onClick={restartCards}
                    >
                      <FaSync className="w-3 h-3 mr-1.5" />
                      <span className="font-semibold">Recommencer</span>
                    </button>
                    <button 
                      onClick={() => setShowDownload(true)}
                      className="bg-[#25a1e1] text-[#ebebd7] rounded-xl py-2 px-3 text-sm font-medium flex items-center justify-center shadow-md hover:bg-[#106996]"
                    >
                      <FaDownload className="w-3 h-3 mr-1.5" />
                      <span className="font-bold">Télécharger</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Interface desktop optimisée
  const DesktopView = () => (
    <div className="h-[calc(100vh-24px)] px-6 py-4 flex flex-col">
      {/* Header simplifié, inspiré de format-selection.js */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/format-selection')}
            className="mr-4 p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-lg hover:bg-[#68ccff]/20 transition-all duration-300 flex items-center"
          >
            <FaArrowLeft className="w-3 h-3 mr-1" />
            <span className="text-sm font-medium">Retour</span>
          </button>
          <h1 className="text-xl font-bold text-[#25a1e1] flex items-center">
            <span className="mr-2">mémo cartes</span>
          </h1>
          <div className="ml-4 bg-[#68ccff]/10 rounded-full px-3 py-1 flex items-center">
            <span className="text-xs font-medium text-[#106996]">{router.query.cardCount || memoCards.length} cartes générées</span>
          </div>
        </div>
        
        {/* Actions déplacées ici */}
        <div className="flex space-x-2">
          <button 
            className="bg-[#ebebd7] border border-[#68ccff]/30 text-[#25a1e1] rounded-lg py-2 px-3 text-sm font-medium flex items-center shadow-sm hover:bg-[#68ccff]/10 hover:scale-105 transition-all duration-300"
            onClick={restartCards}
          >
            <FaSync className="w-3 h-3 mr-2" />
            Recommencer
          </button>
          
          <button 
            onClick={() => setShowDownload(true)}
            className="bg-[#25a1e1] text-[#ebebd7] rounded-lg py-2 px-3 text-sm font-medium flex items-center shadow-md hover:bg-[#106996] hover:scale-105 transition-all duration-300"
          >
            <FaDownload className="w-3 h-3 mr-2" />
            Télécharger
          </button>
          
          <button 
            className="bg-[#106996] text-[#ebebd7] rounded-lg py-2 px-3 text-sm font-medium flex items-center shadow-md hover:bg-[#25a1e1] hover:scale-105 transition-all duration-300"
          >
            <FaShareAlt className="w-3 h-3 mr-2" />
            Partager
          </button>
        </div>
      </div>
      
      {/* Main content with flashcards and sidebar */}
      <div className="flex flex-1 gap-4 h-[calc(100%-3rem)] overflow-hidden">
        {/* Main central section with flashcards */}
        <div className="flex-1 flex flex-col rounded-2xl">
          {loadingCards ? (
            <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 flex-grow flex flex-col items-center justify-center p-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#25a1e1] mb-3"></div>
              <p className="text-gray-700 font-medium">Création de tes mémo cartes...</p>
              <p className="text-xs text-gray-500 mt-1">Le Fayot prépare des mémo cartes pour ton cours</p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 overflow-hidden">
              {/* mémo cartes */}
              <div className="flex-grow flex items-center justify-center p-4">
                <div className="perspective-1000 w-full max-w-2xl h-[55vh]"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}>
                  <div 
                    ref={cardRef}
                    className={`relative w-full h-full rounded-2xl shadow-lg cursor-pointer transition-transform duration-300 transform-style preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`} 
                    onClick={toggleFlip}
                  >
                    {/* Face avant (question) */}
                    <div className={`absolute w-full h-full backface-hidden rounded-2xl bg-[#ebebd7] border ${isCurrentCardMemorized ? 'border-green-300' : 'border-[#68ccff]/30'} p-6 flex flex-col`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-3 py-1 bg-[#68ccff]/20 text-[#106996] text-sm font-medium rounded-full">Question {currentCardIndex + 1}/{memoCards.length}</span>
                        <button 
                          className={`p-2 rounded-full ${isCurrentCardMemorized ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'} hover:bg-green-100 hover:text-green-500 transition-colors`}
                          onClick={(e) => toggleMemorized(currentCard.id, e)}
                        >
                          <FaBookmark className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-grow flex items-center justify-center overflow-auto">
                        <h3 className="text-2xl font-bold text-gray-800 text-center">{currentCard.question}</h3>
                      </div>
                      <div className="text-center text-gray-500 text-sm mt-3">
                        Cliquez pour voir la réponse
                      </div>
                    </div>

                    {/* Face arrière (réponse) */}
                    <div className="absolute w-full h-full backface-hidden rounded-2xl bg-[#ebebd7] border border-[#68ccff]/30 p-6 flex flex-col rotate-y-180">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Réponse {currentCardIndex + 1}/{memoCards.length}</span>
                        <button 
                          className={`p-2 rounded-full ${isCurrentCardMemorized ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'} hover:bg-green-100 hover:text-green-500 transition-colors`}
                          onClick={(e) => toggleMemorized(currentCard.id, e)}
                        >
                          <FaBookmark className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-grow overflow-auto p-2">
                        <p className="text-gray-700 text-lg">{currentCard.answer}</p>
                      </div>
                      <div className="text-center text-gray-500 text-sm mt-3">
                        Cliquez pour revenir à la question
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Controls under the card */}
              <div className="p-3 border-t border-[#68ccff]/30 bg-[#68ccff]/10">
                <div className="flex justify-between items-center">
                  <button 
                    onClick={goToPrevCard}
                    className="w-10 h-10 bg-[#ebebd7] border border-[#68ccff]/30 text-[#25a1e1] rounded-full flex items-center justify-center shadow-sm hover:bg-[#68ccff]/10 transition-all duration-300"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {memoCards.map((_, index) => (
                      <div 
                        key={index} 
                        className={`w-2 h-2 rounded-full ${currentCardIndex === index ? 'bg-[#25a1e1]' : 'bg-gray-300'}`}
                      />
                    ))}
                  </div>
                  
                  <button 
                    onClick={goToNextCard}
                    className="w-10 h-10 bg-[#25a1e1] text-[#ebebd7] rounded-full flex items-center justify-center shadow-md hover:bg-[#106996] transition-all duration-300"
                  >
                    <FaChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right sidebar with additional features */}
        <div className="w-72 flex flex-col gap-3 h-full overflow-hidden">
          {/* Progress section */}
          <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Progression</h2>
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Mémorisées</span>
                <span className="text-sm font-bold text-[#25a1e1]">{memorizedCount}/{memoCards.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-[#25a1e1] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <div className="bg-[#68ccff]/10 rounded-lg p-3 flex items-start">
              <FaTrophy className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-[#106996]">
                {progress === 100 
                  ? "Félicitations ! Vous avez mémorisé toutes les cartes." 
                  : progress > 50 
                    ? `Bon travail ! Vous avez mémorisé ${Math.round(progress)}% des cartes.`
                    : "Continuez à réviser pour mémoriser toutes les cartes."}
              </p>
            </div>
          </div>
          
          {/* Tips section */}
          <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 p-4 flex-grow overflow-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Astuces</h2>
            <div className="space-y-2">
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                <p className="text-sm text-yellow-800">
                  <span className="font-bold block mb-1">Conseil de mémorisation</span>
                  Révisez régulièrement vos cartes pour un apprentissage optimal. La répétition espacée est la clé !
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-sm text-green-800">
                  <span className="font-bold block mb-1">Saviez-vous que...</span>
                  Expliquer à voix haute ce que vous venez d'apprendre améliore significativement la rétention ?
                </p>
              </div>
              <div className="bg-[#68ccff]/10 rounded-lg p-3 border border-[#68ccff]/30 mt-2">
                <p className="text-sm text-[#106996]">
                  <span className="font-bold block mb-1">Optimisez votre apprentissage</span>
                  Créer une association visuelle avec chaque concept important peut multiplier par 10 votre capacité à mémoriser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className='flex flex-col md:flex-row h-screen bg-gradient-to-br from-[#68ccff]/20 via-[#ebebd7] to-[#68ccff]/10 overflow-hidden'>
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

export default withAuth(Results); 