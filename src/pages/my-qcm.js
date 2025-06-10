import { useState, useEffect } from 'react';
import { NavBarComponent, SubscriptionBlock } from '../../components/NavBarComponent';
import { useRouter } from 'next/router';
import { FaPlus, FaBook, FaShareAlt, FaEdit, FaTrashAlt, FaBrain, FaLightbulb, FaStar, FaClock, FaEye, FaCrown, FaBars, FaHome, FaStickyNote, FaQuestionCircle, FaUserAlt, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { CiMenuBurger } from "react-icons/ci";
import Link from 'next/link';
import { BsQuestionCircleFill } from 'react-icons/bs';
import { withAuth } from '../hoc/withAuth';
import { supabase } from '../utils/supabaseClient';

const MyQcmComponent = ({ user }) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedQcm, setSelectedQcm] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [qcms, setQcms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les QCMs depuis Supabase
  useEffect(() => {
    const fetchQcmLists = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setQcms(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des QCMs:', error);
        setError('Impossible de charger vos QCMs. Veuillez réessayer.');
        setLoading(false);
      }
    };

    if (user) {
      fetchQcmLists();
    }
  }, [user]);

  // Générer une couleur aléatoire pour les cartes
  const getRandomColor = (id) => {
    const colors = ['#FDE68A', '#BFDBFE', '#DDD6FE', '#A7F3D0', '#FECACA'];
    const index = id ? Math.abs(id.charCodeAt(0) % colors.length) : Math.floor(Math.random() * colors.length);
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
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  const handleStudyQcm = (qcmId) => {
    router.push(`/results/qcm/${qcmId}`);
  };

  const handleCreateQcm = () => {
    router.push('/format-selection');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const MobileView = () => (
    <div className="p-3">
      {/* Header avec titre et bouton d'ajout */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-lg font-bold text-[#25a1e1]">Mes QCMs</h1>
        <button 
          onClick={toggleMenu}
          className="p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-lg shadow-sm hover:bg-[#68ccff]/20 transition-colors duration-300"
        >
          <CiMenuBurger className="w-4 h-4" />
        </button>
      </div>

      {/* Message d'encouragement */}
      <div className="bg-[#ebebd7] rounded-lg shadow-sm border border-[#68ccff]/30 p-2 mb-3 text-xs">
        <p className="text-[#106996] font-medium">
          <FaLightbulb className="inline-block text-yellow-500 mr-1" />
          Les QCMs sont idéals pour tester tes connaissances !
        </p>
      </div>

      {/* Bouton créer */}
      <div className="mb-3">
        <button 
          onClick={handleCreateQcm}
          className="w-full bg-[#25a1e1] text-[#ebebd7] font-semibold py-1.5 px-3 rounded-lg hover:bg-[#106996] transition-colors duration-300 flex items-center justify-center shadow-sm text-sm"
        >
          <FaPlus className="mr-1.5" /> Créer un nouveau QCM
        </button>
      </div>

      {/* Liste des QCMs */}
      {loading ? (
        <div className="bg-[#ebebd7] rounded-lg shadow-sm border border-[#68ccff]/30 p-3 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#25a1e1] mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Chargement de vos QCMs...</p>
        </div>
      ) : error ? (
        <div className="bg-[#ebebd7] rounded-lg shadow-sm border border-red-200 p-3 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : qcms.length === 0 ? (
        <div className="bg-[#ebebd7] rounded-lg shadow-sm border border-[#68ccff]/30 p-3 text-center">
          <p className="text-gray-600 mb-1 text-sm">Vous n'avez pas encore de QCM.</p>
          <p className="text-[#25a1e1] font-medium text-sm">Créez votre premier QCM !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {qcms.map((qcm) => (
            <div 
              key={qcm.id}
              className="bg-[#ebebd7] rounded-lg shadow-sm border border-[#68ccff]/30 p-2.5 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-2.5"
                  style={{ backgroundColor: getRandomColor(qcm.id) }}
                >
                  <BsQuestionCircleFill className="text-[#106996] w-5 h-5" />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-[#106996] text-sm mb-0.5 truncate">{qcm.title || 'QCM sans titre'}</h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <FaClock className="mr-1 flex-shrink-0" />
                    <span className="truncate">Créé le {formatDate(qcm.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-between">
                <button 
                  onClick={() => handleStudyQcm(qcm.id)}
                  className="bg-[#25a1e1]/10 text-[#25a1e1] font-medium py-1 px-2.5 rounded-md hover:bg-[#25a1e1]/20 transition-colors text-xs"
                >
                  <FaBrain className="inline-block mr-1" /> Commencer
                </button>
                <div>
                  <button className="text-gray-500 p-1 hover:text-[#25a1e1] transition-colors">
                    <FaShareAlt className="w-3.5 h-3.5" />
                  </button>
                  <button className="text-gray-500 p-1 hover:text-[#25a1e1] transition-colors ml-1">
                    <FaEdit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce QCM ?')) {
                        handleDeleteQcm(qcm.id);
                      }
                    }} 
                    className="text-gray-500 p-1 hover:text-red-500 transition-colors ml-1"
                  >
                    <FaTrashAlt className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Bloc d'abonnement */}
      <div className="mt-3">
        <SubscriptionBlock remainingCards={2} />
      </div>
    </div>
  );

  const DesktopView = () => (
    <div className="px-6 py-4">
      {/* Header avec titre et bouton d'ajout */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#25a1e1]">Mes QCMs</h1>
          <p className="text-gray-500 text-sm">Vos QCMs personnalisés pour réviser efficacement</p>
        </div>
        <button 
          onClick={handleCreateQcm}
          className="bg-[#25a1e1] text-[#ebebd7] font-semibold py-1.5 px-3.5 rounded-lg hover:bg-[#106996] transition-colors duration-300 flex items-center shadow-sm text-sm"
        >
          <FaPlus className="mr-1.5" /> Créer un nouveau QCM
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex gap-4">
        {/* Liste des QCMs */}
        <div className="flex-grow">
          {loading ? (
            <div className="bg-[#ebebd7] rounded-xl shadow-sm border border-[#68ccff]/30 p-6 text-center h-[250px] flex items-center justify-center">
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#25a1e1] mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Chargement de vos QCMs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-[#ebebd7] rounded-xl shadow-sm border border-red-200 p-6 text-center h-[250px] flex items-center justify-center">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : qcms.length === 0 ? (
            <div className="bg-[#ebebd7] rounded-xl shadow-sm border border-[#68ccff]/30 p-6 text-center h-[250px] flex flex-col items-center justify-center">
              <BsQuestionCircleFill className="text-[#25a1e1] w-12 h-12 mb-3 opacity-50" />
              <p className="text-gray-600 mb-1.5 text-sm">Vous n'avez pas encore de QCM.</p>
              <p className="text-[#25a1e1] font-medium mb-3 text-sm">Créez votre premier QCM pour commencer à réviser !</p>
              <button 
                onClick={handleCreateQcm}
                className="bg-[#25a1e1] text-[#ebebd7] font-semibold py-1.5 px-3.5 rounded-lg hover:bg-[#106996] transition-colors duration-300 flex items-center shadow-sm text-sm"
              >
                <FaPlus className="mr-1.5" /> Créer un QCM
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {qcms.map((qcm) => (
                <div 
                  key={qcm.id}
                  className="bg-[#ebebd7] rounded-lg shadow-sm border border-[#68ccff]/30 p-3 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-start">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 mr-3"
                      style={{ backgroundColor: getRandomColor(qcm.id) }}
                    >
                      <BsQuestionCircleFill className="text-[#106996] w-6 h-6" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-[#106996] text-base mb-0.5 truncate">{qcm.title || 'QCM sans titre'}</h3>
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <FaClock className="mr-1 flex-shrink-0" />
                        <span className="truncate">Créé le {formatDate(qcm.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <button 
                          onClick={() => handleStudyQcm(qcm.id)}
                          className="bg-[#25a1e1]/10 text-[#25a1e1] font-medium py-1 px-2.5 rounded-md hover:bg-[#25a1e1]/20 transition-colors text-xs flex items-center"
                        >
                          <FaBrain className="mr-1.5" /> Commencer
                        </button>
                        <div>
                          <button className="text-gray-500 p-1.5 hover:text-[#25a1e1] transition-colors rounded-md hover:bg-[#68ccff]/10">
                            <FaShareAlt className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer ce QCM ?')) {
                                handleDeleteQcm(qcm.id);
                              }
                            }} 
                            className="text-gray-500 p-1.5 hover:text-[#25a1e1] transition-colors ml-0.5 rounded-md hover:bg-[#68ccff]/10"
                          >
                            <FaEdit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer ce QCM ?')) {
                                handleDeleteQcm(qcm.id);
                              }
                            }} 
                            className="text-gray-500 p-1.5 hover:text-red-500 transition-colors ml-0.5 rounded-md hover:bg-red-50"
                          >
                            <FaTrashAlt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-64">
          <div className="bg-[#ebebd7] rounded-lg shadow-sm border border-[#68ccff]/30 p-3 mb-4">
            <h2 className="font-semibold text-[#106996] mb-2 text-sm">Conseils d'utilisation</h2>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start">
                <FaLightbulb className="text-yellow-500 mt-0.5 mr-1.5 flex-shrink-0" />
                <p className="text-gray-700">Les QCMs sont parfaits pour tester vos connaissances avant un examen.</p>
              </li>
              <li className="flex items-start">
                <FaStar className="text-yellow-500 mt-0.5 mr-1.5 flex-shrink-0" />
                <p className="text-gray-700">Essayez de créer des QCMs avec des questions variées pour une révision complète.</p>
              </li>
            </ul>
          </div>
          
          <SubscriptionBlock remainingCards={2} />
        </div>
      </div>
    </div>
  );

  // Fonction de suppression des QCMs
  const handleDeleteQcm = async (qcmId) => {
    try {
      // Supprimer les questions associées au QCM
      const { error: questionsDeleteError } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', qcmId);
      
      // Supprimer le QCM
      const { error: quizDeleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', qcmId);
      
      if (quizDeleteError) throw quizDeleteError;
      
      // Mettre à jour l'état pour retirer le QCM de la liste
      setQcms(qcms.filter(q => q.id !== qcmId));
      
      // Si le QCM supprimé était sélectionné, désélectionner
      if (selectedQcm === qcmId) {
        setSelectedQcm(null);
        setPreviewOpen(false);
      }
      
    } catch (error) {
      console.error('Erreur lors de la suppression du QCM:', error);
      alert('Erreur lors de la suppression du QCM. Veuillez réessayer.');
    }
  };

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
                    href="/my-courses" 
                    className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaBook className="w-5 h-5 text-[#25a1e1]" />
                    <span className='ml-3 text-[16px] font-medium'>Mes cours</span>
                  </Link>
                  
                  <Link 
                    href="/my-cards" 
                    className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaStickyNote className="w-5 h-5 text-[#25a1e1]" />
                    <span className='ml-3 text-[16px] font-medium'>Mes mémo cartes</span>
                  </Link>

                  <Link 
                    href="/my-qcm" 
                    className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-[#68ccff]/20 bg-[#68ccff]/10'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaQuestionCircle className="w-5 h-5 text-[#25a1e1]" />
                    <span className='ml-3 text-[16px] font-medium'>Mes QCMs</span>
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
                  <button onClick={handleLogout} className='flex items-center w-full rounded-xl px-4 py-3 transition-all bg-red-50 hover:bg-red-100 hover:scale-105 text-red-600 font-semibold'>
                    <FaSignOutAlt className="w-5 h-5 mr-3" /> Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default withAuth(MyQcmComponent);
