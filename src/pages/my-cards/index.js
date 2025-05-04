import { useState, useEffect } from 'react';
import { NavBarComponent, SubscriptionBlock } from '../../../components/NavBarComponent';
import { useRouter } from 'next/router';
import { FaPlus, FaBook, FaShareAlt, FaEdit, FaTrashAlt, FaBrain, FaLightbulb, FaStar, FaClock, FaEye, FaCrown, FaBars } from 'react-icons/fa';
import { CiHome, CiMenuBurger } from "react-icons/ci";
import Link from 'next/link';
import { BsCardHeading } from 'react-icons/bs';
import { withAuth } from '../../hoc/withAuth';
import { supabase } from '../../utils/supabaseClient';

const MyCardsComponent = ({ user }) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Récupérer les flashcards depuis Supabase
  useEffect(() => {
    const fetchFlashcardLists = async () => {
      try {
        setLoading(true);
        console.log("Récupération des listes de mémocartes");
        
        // 1. Récupérer les listes de flashcards (table flashcard_lists)
        const { data: flashcardLists, error: listsError } = await supabase
          .from('flashcard_lists')
          .select(`
            *,
            documents:document_id (
              title,
              file_type
            )
          `)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (listsError) {
          console.error("Erreur lors de la récupération des listes:", listsError);
          throw listsError;
        }
        
        console.log("Listes récupérées:", flashcardLists);
        
        // 2. Pour chaque liste, compter le nombre de cartes
        const listsWithCardCounts = [];
        for (const list of flashcardLists) {
          // Récupérer le nombre de cartes pour cette liste
          const { count, error: countError } = await supabase
            .from('flashcards')
            .select('id', { count: 'exact' })
            .eq('list_id', list.id);
          
          if (countError) {
            console.error(`Erreur lors du comptage des cartes pour la liste ${list.id}:`, countError);
          }
          
          // Transformer les données pour correspondre au format attendu
          listsWithCardCounts.push({
            id: list.id, // Utiliser l'UUID de la liste
            title: list.title || (list.documents ? list.documents.title : 'Sans titre'),
            description: list.description || `Cartes de révision pour ${list.title || 'document'}`,
            courseTitle: list.documents ? list.documents.title : 'Document',
            cardCount: count || list.card_count || 0,
            lastUsed: new Date(list.updated_at).toLocaleDateString('fr-FR'),
            color: getRandomColor(list.id),
            progress: Math.floor(Math.random() * 100) // Simuler une progression
          });
        }
        
        console.log("Listes formatées:", listsWithCardCounts);
        setDecks(listsWithCardCounts);
      } catch (err) {
        setError(err.message);
        console.error('Erreur lors de la récupération des listes de mémocartes:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFlashcardLists();
    }
  }, [user]);

  // Fonction pour générer une couleur cohérente basée sur l'ID
  const getRandomColor = (id) => {
    const colors = ["#25a1e1", "#68ccff", "#106996"];
    const index = parseInt(id.slice(0, 8), 16) % colors.length;
    return colors[index];
  };
  
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
  
  const handleStudyDeck = (deckId) => {
    router.push(`/my-cards/${deckId}`);
  };
  
  const handleCreateDeck = () => {
    router.push('/new-deck');
  };
  
  // Formater le pourcentage de progression
  const formatProgress = (progress) => {
    return progress < 30 ? "Débutant" : progress < 70 ? "Intermédiaire" : "Avancé";
  };
  
  // Interface mobile optimisée plus compacte
  const MobileView = () => (
    <div className="min-h-screen mx-2 my-2 flex flex-col">
      {/* Header simplifié */}
      <div className="flex justify-between items-center px-3 py-2 bg-[#ebebd7] rounded-xl shadow-sm border border-[#68ccff]/30 mb-3">
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

      {/* En-tête de page */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-bold text-[#106996]">Mes mémo cartes</h1>
        <button 
          onClick={handleCreateDeck}
          className="bg-[#106996] text-[#ebebd7] text-sm font-medium py-1.5 px-3 rounded-xl shadow-sm flex items-center"
        >
          <FaPlus className="mr-1.5" /> Ajouter
        </button>
      </div>
      
      {/* Liste des jeux de cartes - version compacte */}
      <div className="flex-grow overflow-y-auto mb-3">
        <div className="flex flex-col gap-2">
          {decks.map((deck) => (
            <div 
              key={deck.id} 
              className={`bg-[#ebebd7] p-2 rounded-xl shadow-sm border border-[#68ccff]/30 relative flex h-16 ${selectedDeck === deck.id ? 'ring-2 ring-[#25a1e1]' : ''}`}
              onClick={() => setSelectedDeck(deck.id)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: deck.color }}></div>
              <div className="pl-1.5 flex-grow flex">
                <div className="flex flex-col justify-between flex-grow">
                  <h3 className="text-xs font-semibold text-[#106996] line-clamp-1">{deck.title}</h3>
                  <div className="flex items-center text-[10px] text-gray-500">
                    <FaBook className="w-2.5 h-2.5 mr-0.5 text-gray-500" />
                    <span className="line-clamp-1">{deck.courseTitle}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStudyDeck(deck.id);
                      }}
                      className="bg-[#25a1e1]/10 text-[#25a1e1] text-[10px] font-medium py-0.5 px-1 rounded-md shadow-sm flex items-center"
                    >
                      <FaBrain className="mr-0.5 w-2 h-2" /> Réviser
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-[10px] text-gray-400 mr-0.5">
                    {deck.cardCount} cartes
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bloc d'abonnement mobile */}
      <div className="mb-2">
        <SubscriptionBlock remainingCards={2} />
      </div>
    </div>
  );
  
  // Interface desktop avec le même design que HomeComponent mais plus simple
  const DesktopView = () => (
    <div className="w-full min-h-screen py-6 px-6 bg-gradient-to-br from-[#68ccff]/10 via-[#ebebd7] to-[#68ccff]/10">
      {/* Header avec titre et bouton d'ajout - directement sur la page */}
      <div className="w-full mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-[#106996]">Mes mémo cartes</h1>
        </div>
        <button 
          onClick={handleCreateDeck}
          className="bg-[#106996] text-[#ebebd7] font-bold py-2.5 px-5 rounded-xl hover:bg-[#0d5475] hover:scale-105 transition-all duration-300 shadow-md border border-[#106996]/70 hover:shadow-lg flex items-center"
        >
          <FaPlus className="mr-2" /> Ajouter un jeu
        </button>
      </div>
      
      {/* Contenu principal avec liste des jeux de cartes et détails */}
      <div className="w-full flex relative">
        {/* Liste des jeux de cartes (60%) - sans restriction de hauteur pour permettre le scroll de page */}
        <div className="w-3/5 pr-6">
          {/* Liste de jeux de cartes plus fine sans bulle extérieure */}
          <div className="flex flex-col gap-2 pb-6">
            {decks.map((deck) => (
              <div 
                key={deck.id} 
                className={`bg-[#ebebd7] p-2 rounded-xl border border-[#68ccff]/30 shadow-sm relative transition-all duration-300 h-20 flex ${selectedDeck === deck.id ? 'ring-2 ring-[#25a1e1] scale-[1.01]' : 'hover:bg-[#68ccff]/5'}`}
                onClick={() => setSelectedDeck(deck.id)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: deck.color }}></div>
                <div className="pl-2 flex-grow flex">
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="text-sm font-semibold text-[#106996] line-clamp-1">{deck.title}</h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <FaBook className="w-3 h-3 mr-1 text-gray-500" />
                        <span className="line-clamp-1">{deck.courseTitle}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1 mt-auto">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudyDeck(deck.id);
                        }}
                        className="bg-[#25a1e1]/10 text-[#25a1e1] text-xs font-medium py-0.5 px-1.5 rounded-md shadow-sm hover:bg-[#25a1e1]/20 hover:scale-105 transition-all duration-300 flex items-center"
                      >
                        <FaBrain className="mr-1 w-2.5 h-2.5" /> Réviser
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between ml-2">
                    <div className="flex items-center text-[10px] text-gray-400">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full mr-1.5">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${deck.progress}%`,
                            backgroundColor: deck.progress < 30 ? "#f97316" : deck.progress < 70 ? "#facc15" : "#22c55e"
                          }}
                        ></div>
                      </div>
                      {deck.cardCount} cartes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partie droite - Détails du jeu ou Mascotte (40%) - sticky lors du défilement de la page */}
        <div className="w-2/5 pl-6">
          <div className="sticky top-6 bg-[#ebebd7] p-6 rounded-xl border border-[#68ccff]/30 shadow-md h-[calc(100vh-150px)] flex flex-col overflow-y-auto">
            {selectedDeck ? (
              // Détails du jeu de cartes sélectionné
              <div className="h-full flex flex-col">
                <h2 className="text-2xl font-semibold text-[#106996] mb-4">
                  {decks.find(d => d.id === selectedDeck)?.title}
                </h2>
                
                <div className="flex-grow overflow-y-auto">
                  <div className="bg-[#68ccff]/10 p-4 rounded-xl mb-4">
                    <h3 className="text-lg font-medium text-[#106996] mb-2 flex items-center">
                      <FaBook className="mr-2 text-[#25a1e1]" /> Détails du jeu
                    </h3>
                    <p className="text-gray-700 mb-2">
                      {decks.find(d => d.id === selectedDeck)?.description}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <FaBook className="w-4 h-4 mr-1 text-gray-500" />
                      <span>Cours: {decks.find(d => d.id === selectedDeck)?.courseTitle}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Dernière révision: {decks.find(d => d.id === selectedDeck)?.lastUsed}
                    </div>
                    <div className="text-sm text-gray-500">
                      Nombre de cartes: {decks.find(d => d.id === selectedDeck)?.cardCount}
                    </div>
                  </div>
                  
                  <div className="bg-[#68ccff]/10 p-4 rounded-xl">
                    <h3 className="text-lg font-medium text-[#106996] mb-2 flex items-center">
                      <FaLightbulb className="mr-2 text-[#25a1e1]" /> Progression
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-[#106996]">Niveau de maîtrise</span>
                          <span className="text-sm text-gray-500">{formatProgress(decks.find(d => d.id === selectedDeck)?.progress)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${decks.find(d => d.id === selectedDeck)?.progress}%`,
                              backgroundColor: decks.find(d => d.id === selectedDeck)?.progress < 30 ? "#f97316" : 
                                                      decks.find(d => d.id === selectedDeck)?.progress < 70 ? "#facc15" : "#22c55e"
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="bg-[#ebebd7] p-3 rounded-lg">
                        <div className="flex items-center text-[#106996] mb-2">
                          <FaStar className="w-4 h-4 mr-2 text-yellow-500" />
                          <span className="font-medium">Conseils</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {decks.find(d => d.id === selectedDeck)?.progress < 30 
                            ? "Révisez quotidiennement pour améliorer votre mémorisation."
                            : decks.find(d => d.id === selectedDeck)?.progress < 70 
                            ? "Bon travail ! Continuez à réviser régulièrement."
                            : "Excellent ! Pensez à créer des cartes plus avancées."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex mt-5 pt-3 border-t border-[#68ccff]/20">
                  <button
                    onClick={() => handleStudyDeck(selectedDeck)}
                    className="w-full bg-[#25a1e1] text-[#ebebd7] font-bold py-2.5 px-4 rounded-xl hover:bg-[#1d91c9] hover:scale-105 transition-all duration-300 shadow-md flex items-center justify-center"
                  >
                    <FaBrain className="mr-2" /> Réviser
                  </button>
                </div>
              </div>
            ) : (
              // Mascotte avec message d'aide - version qui prend toute la hauteur
              <div className="h-full flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 mb-6">
                  <div className="absolute inset-0 bg-[#25a1e1] rounded-full w-32 h-32 shadow-lg border-4 border-[#ebebd7]"></div>
                  <div className="absolute top-[25%] left-[20%] w-6 h-6 bg-[#ebebd7] rounded-full"></div>
                  <div className="absolute top-[25%] right-[20%] w-6 h-6 bg-[#ebebd7] rounded-full"></div>
                  <div className="absolute bottom-[30%] left-[37%] w-10 h-4 bg-[#ebebd7] rounded-full"></div>
                  <div className="absolute -bottom-2 left-[42%] w-5 h-5 bg-[#25a1e1] rounded-full border-4 border-[#ebebd7]"></div>
                </div>
                
                <div className="bg-[#68ccff]/10 p-4 rounded-xl max-w-md mb-5 relative">
                  <div className="absolute -top-3 left-10 w-4 h-4 bg-[#68ccff]/10 transform rotate-45"></div>
                  <p className="text-center text-[#106996]">
                    Sélectionne un jeu de cartes pour voir les détails et commencer à réviser !
                  </p>
                </div>
                
                <div className="w-full mt-8">
                  <SubscriptionBlock remainingCards={2} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className='flex md:flex-row min-h-screen'>
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
                  <Link 
                    href="/my-courses" 
                    className='flex items-center w-full rounded-xl px-4 py-3 transition-all duration-300 active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaBook className="w-5 h-5 text-[#25a1e1]" />
                    <span className='ml-3 text-[16px] font-medium'>Mes cours</span>
                  </Link>
                  <Link 
                    href="/my-cards" 
                    className='flex items-center w-full rounded-xl px-4 py-3 transition-all duration-300 active:bg-[#68ccff]/20 bg-[#68ccff]/10'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BsCardHeading className="w-5 h-5 text-[#25a1e1]" />
                    <span className='ml-3 text-[16px] font-medium'>Mes mémo cartes</span>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default withAuth(MyCardsComponent);
