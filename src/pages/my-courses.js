import { useState, useEffect } from 'react';
import { NavBarComponent, SubscriptionBlock } from '../../components/NavBarComponent';
import { useRouter } from 'next/router';
import { FaCloudUploadAlt, FaPlus, FaArrowRight, FaGraduationCap, FaBrain, FaBook, FaLightbulb, FaStar, FaRocket, FaQuestionCircle, FaCrown, FaBars, FaRegFileAlt, FaRegListAlt, FaEye, FaFilePdf, FaImage, FaHome, FaStickyNote, FaUserAlt, FaCog, FaSignOutAlt, FaTrashAlt, FaClock } from 'react-icons/fa';
import { CiHome, CiMenuBurger } from "react-icons/ci";
import Link from 'next/link';
import { BsCardHeading } from 'react-icons/bs';
import { withAuth } from '../hoc/withAuth';
import { supabase } from '../utils/supabaseClient';

const MyCourseComponent = ({ user }) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Récupérer les documents depuis Supabase
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transformer les données pour correspondre au format attendu
        const formattedCourses = data.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: `Document ${doc.file_type.toUpperCase()}`,
          lastUpdated: new Date(doc.updated_at).toLocaleDateString('fr-FR'),
          pages: Math.floor(doc.file_size / 1000), // Approximation basée sur la taille du fichier
          color: getRandomColor(doc.id), // Fonction pour générer une couleur cohérente
          type: doc.file_type.toLowerCase()
        }));

        setCourses(formattedCourses);
      } catch (err) {
        setError(err.message);
        console.error('Erreur lors de la récupération des documents:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDocuments();
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
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
  };
  
  const handleCreateCards = (courseId) => {
    router.push(`/format-selection?courseId=${courseId}&format=memo`);
  };
  
  const handleCreateQuiz = (courseId) => {
    router.push(`/format-selection?courseId=${courseId}&format=qcm`);
  };
  
  const handleUploadCourse = () => {
    router.push('/format-selection');
  };

  const handlePreviewCourse = (courseId) => {
    setSelectedCourse(courseId);
    setPreviewOpen(true);
  };
  
  // Interface mobile optimisée plus compacte
  const MobileView = () => (
    <div className="p-3">
      {/* Header avec titre et bouton d'ajout */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-lg font-bold text-[#25a1e1]">Mes cours</h1>
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
          Importez vos cours et générez des QCMs ou mémo cartes en quelques clics !
        </p>
      </div>

      {/* Bouton créer */}
      <div className="mb-3">
        <button 
          onClick={handleUploadCourse}
          className="w-full bg-[#25a1e1] text-[#ebebd7] font-semibold py-1.5 px-3 rounded-lg hover:bg-[#106996] transition-colors duration-300 flex items-center justify-center shadow-sm text-sm"
        >
          <FaPlus className="mr-1.5" /> Ajouter un cours
        </button>
      </div>

      {/* Liste des cours */}
      {loading ? (
        <div className="bg-[#ebebd7] rounded-lg shadow-sm border border-[#68ccff]/30 p-3 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#25a1e1] mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Chargement de vos cours...</p>
        </div>
      ) : error ? (
        <div className="bg-[#ebebd7] rounded-lg shadow-sm border border-red-200 p-3 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-[#ebebd7] rounded-lg shadow-sm border border-[#68ccff]/30 p-3 text-center">
          <p className="text-gray-600 mb-1 text-sm">Vous n'avez pas encore de cours.</p>
          <p className="text-[#25a1e1] font-medium text-sm">Ajoutez votre premier cours !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="bg-[#ebebd7] rounded-lg shadow-sm border border-[#68ccff]/30 p-2.5 hover:shadow-md transition-shadow duration-300"
              onClick={() => setSelectedCourse(course.id)}
            >
              <div className="flex items-start">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-2.5"
                  style={{ backgroundColor: course.color }}
                >
                  {course.type === "pdf" ? 
                    <FaFilePdf className="text-[#106996] w-5 h-5" /> : 
                    <FaImage className="text-[#106996] w-5 h-5" />
                  }
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-[#106996] text-sm mb-0.5 truncate">{course.title}</h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <FaClock className="mr-1 flex-shrink-0" />
                    <span className="truncate">Mis à jour le {course.lastUpdated}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-between">
                <div className="flex space-x-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateCards(course.id);
                    }}
                    className="bg-[#25a1e1]/10 text-[#25a1e1] text-xs font-medium py-1 px-2 rounded-md hover:bg-[#25a1e1]/20 transition-colors flex items-center"
                  >
                    <BsCardHeading className="mr-1 w-3 h-3" /> Mémo
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateQuiz(course.id);
                    }}
                    className="bg-[#106996]/10 text-[#106996] text-xs font-medium py-1 px-2 rounded-md hover:bg-[#106996]/20 transition-colors flex items-center"
                  >
                    <FaQuestionCircle className="mr-1 w-3 h-3" /> QCM
                  </button>
                </div>
                <div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewCourse(course.id);
                    }} 
                    className="text-gray-500 p-1 hover:text-[#25a1e1] transition-colors"
                  >
                    <FaEye className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                        handleDeleteCourse(course.id);
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
  
  // Interface desktop avec le même design que HomeComponent mais plus simple
  const DesktopView = () => (
    <div className="w-full min-h-screen py-6 px-6 bg-gradient-to-br from-[#68ccff]/10 via-[#ebebd7] to-[#68ccff]/10">
      {/* Header avec titre et bouton d'ajout - directement sur la page */}
      <div className="w-full mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-[#106996]">Mes Cours</h1>
        </div>
        <button 
          onClick={handleUploadCourse}
          className="bg-[#106996] text-[#ebebd7] font-bold py-2.5 px-5 rounded-xl hover:bg-[#0d5475] hover:scale-105 transition-all duration-300 shadow-md border border-[#106996]/70 hover:shadow-lg flex items-center"
        >
          <FaPlus className="mr-2" /> Ajouter un cours
        </button>
      </div>
      
      {/* Contenu principal avec liste des cours et détails */}
      <div className="w-full flex relative">
        {/* Liste des cours (60%) - sans restriction de hauteur pour permettre le scroll de page */}
        <div className="w-3/5 pr-6">
          {/* Liste de cours plus fine sans bulle extérieure */}
          <div className="flex flex-col gap-2 pb-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#25a1e1]"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-4">
                Une erreur est survenue lors du chargement de vos cours.
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                Vous n'avez pas encore de cours. Commencez par en ajouter un !
              </div>
            ) : courses.map((course) => (
              <div 
                key={course.id} 
                className={`bg-[#ebebd7] p-2 rounded-xl border border-[#68ccff]/30 shadow-sm relative transition-all duration-300 h-20 flex ${selectedCourse === course.id ? 'ring-2 ring-[#25a1e1] scale-[1.01]' : 'hover:bg-[#68ccff]/5'}`}
                onClick={() => setSelectedCourse(course.id)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: course.color }}></div>
                <div className="pl-2 flex-grow flex">
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="text-sm font-semibold text-[#106996] line-clamp-1">{course.title}</h3>
                      <div className="flex items-center text-xs text-gray-500">
                        {course.type === "pdf" ? 
                          <FaFilePdf className="w-3 h-3 mr-1 text-red-500" /> : 
                          <FaImage className="w-3 h-3 mr-1 text-blue-500" />
                        }
                        <span>{course.pages} pages</span>
                      </div>
                    </div>
                    <div className="flex space-x-1 mt-auto">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateCards(course.id);
                        }}
                        className="bg-[#25a1e1]/10 text-[#25a1e1] text-xs font-medium py-0.5 px-1.5 rounded-md shadow-sm hover:bg-[#25a1e1]/20 hover:scale-105 transition-all duration-300 flex items-center"
                      >
                        <BsCardHeading className="mr-1 w-2.5 h-2.5" /> Mémo
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateQuiz(course.id);
                        }}
                        className="bg-[#106996]/10 text-[#106996] text-xs font-medium py-0.5 px-1.5 rounded-md shadow-sm hover:bg-[#106996]/20 hover:scale-105 transition-all duration-300 flex items-center"
                      >
                        <FaQuestionCircle className="mr-1 w-2.5 h-2.5" /> QCM
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between ml-2">
                    <div className="flex">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewCourse(course.id);
                        }} 
                        className="flex-shrink-0 bg-[#68ccff]/20 text-[#25a1e1] p-1 rounded-md hover:bg-[#68ccff]/30 transition-all hover:scale-105 mr-1"
                      >
                        <FaEye className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                            handleDeleteCourse(course.id);
                          }
                        }} 
                        className="flex-shrink-0 bg-red-100 text-red-600 p-1 rounded-md hover:bg-red-200 transition-all hover:scale-105"
                      >
                        <FaTrashAlt className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {course.lastUpdated}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partie droite - Détails du cours ou Mascotte (40%) - sticky lors du défilement de la page */}
        <div className="w-2/5 pl-6">
          <div className="sticky top-6 bg-[#ebebd7] p-6 rounded-xl border border-[#68ccff]/30 shadow-md h-[calc(100vh-150px)] flex flex-col overflow-y-auto">
            {selectedCourse ? (
              // Détails du cours sélectionné
              <div className="h-full flex flex-col">
                <h2 className="text-2xl font-semibold text-[#106996] mb-4">
                  {courses.find(c => c.id === selectedCourse)?.title}
                </h2>
                
                <div className="flex-grow overflow-y-auto">
                  {previewOpen ? (
                    // Aperçu du cours (PDF ou image)
                    <div className="h-full flex flex-col">
                      <div className="bg-[#68ccff]/5 p-2 rounded-xl mb-4 flex justify-between items-center">
                        <div className="flex items-center text-[#106996]">
                          {courses.find(c => c.id === selectedCourse)?.type === "pdf" ? 
                            <FaFilePdf className="w-5 h-5 mr-2 text-red-500" /> : 
                            <FaImage className="w-5 h-5 mr-2 text-blue-500" />
                          }
                          <span>Aperçu du document</span>
                        </div>
                        <button 
                          onClick={() => setPreviewOpen(false)}
                          className="text-[#25a1e1] text-sm hover:text-[#106996]"
                        >
                          Fermer l'aperçu
                        </button>
                      </div>
                      
                      <div className="flex-grow bg-gray-100 rounded-xl flex items-center justify-center p-3 border-2 border-[#68ccff]/20">
                        {courses.find(c => c.id === selectedCourse)?.type === "pdf" ? (
                          <div className="text-center">
                            <FaFilePdf className="w-16 h-16 text-red-500 mx-auto mb-3" />
                            <p className="text-[#106996] text-lg font-medium">Aperçu du PDF</p>
                            <p className="text-gray-500 text-sm">
                              {courses.find(c => c.id === selectedCourse)?.pages} pages
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-48 h-64 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center border border-gray-300">
                              <FaImage className="w-12 h-12 text-gray-400" />
                            </div>
                            <p className="text-[#106996] text-sm">
                              Aperçu de l'image
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#68ccff]/10 p-4 rounded-xl mb-4">
                        <h3 className="text-lg font-medium text-[#106996] mb-2 flex items-center">
                          <FaRegFileAlt className="mr-2 text-[#25a1e1]" /> Détails du cours
                        </h3>
                        <p className="text-gray-700 mb-2">
                          {courses.find(c => c.id === selectedCourse)?.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          {courses.find(c => c.id === selectedCourse)?.type === "pdf" ? 
                            <FaFilePdf className="w-4 h-4 mr-1 text-red-500" /> : 
                            <FaImage className="w-4 h-4 mr-1 text-blue-500" />
                          }
                          <span>Type: {courses.find(c => c.id === selectedCourse)?.type === "pdf" ? "Document PDF" : "Image"}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Dernière mise à jour: {courses.find(c => c.id === selectedCourse)?.lastUpdated}
                        </div>
                        <div className="text-sm text-gray-500">
                          Nombre de pages: {courses.find(c => c.id === selectedCourse)?.pages}
                        </div>
                        
                        <button 
                          onClick={() => setPreviewOpen(true)}
                          className="mt-3 flex items-center text-[#25a1e1] text-sm font-medium hover:text-[#106996] transition-colors"
                        >
                          <FaEye className="mr-1.5" /> Voir le document
                        </button>
                      </div>
                      
                      <div className="bg-[#68ccff]/10 p-4 rounded-xl">
                        <h3 className="text-lg font-medium text-[#106996] mb-2 flex items-center">
                          <FaRegListAlt className="mr-2 text-[#25a1e1]" /> Contenu généré
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-[#ebebd7] p-2 rounded-lg">
                            <span className="font-medium text-[#106996]">Mémo cartes</span>
                            <span className="text-sm bg-[#25a1e1]/10 text-[#25a1e1] px-2 py-0.5 rounded-md">12 cartes</span>
                          </div>
                          <div className="flex justify-between items-center bg-[#ebebd7] p-2 rounded-lg">
                            <span className="font-medium text-[#106996]">QCM</span>
                            <span className="text-sm bg-[#106996]/10 text-[#106996] px-2 py-0.5 rounded-md">3 séries</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-3 mt-5 pt-3 border-t border-[#68ccff]/20">
                  <button
                    onClick={() => handleCreateCards(selectedCourse)}
                    className="flex-1 bg-[#25a1e1] text-[#ebebd7] font-bold py-2.5 px-4 rounded-xl hover:bg-[#1d91c9] hover:scale-105 transition-all duration-300 shadow-md flex items-center justify-center"
                  >
                    <BsCardHeading className="mr-2" /> Créer des mémo cartes
                  </button>
                  <button
                    onClick={() => handleCreateQuiz(selectedCourse)}
                    className="flex-1 bg-[#106996] text-[#ebebd7] font-bold py-2.5 px-4 rounded-xl hover:bg-[#0d5475] hover:scale-105 transition-all duration-300 shadow-md flex items-center justify-center"
                  >
                    <FaQuestionCircle className="mr-2" /> Créer un QCM
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
                    Sélectionne un cours pour voir les détails et créer des mémo cartes ou des QCMs sur mesure !
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
  
  // Ajout de la fonction de suppression
  const handleDeleteCourse = async (courseId) => {
    try {
      // Obtenir d'abord les détails du document
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (documentError) throw documentError;
      
      // Supprimer le fichier du bucket storage
      if (document.file_path) {
        const { error: storageError } = await supabase
          .storage
          .from('documents')
          .remove([document.file_path]);
        
        // En environnement de développement, ne pas bloquer si le fichier n'existe pas
        if (storageError && process.env.NODE_ENV !== 'development') {
          throw storageError;
        }
      }
      
      // Supprimer les QCMs associés au document
      const { error: quizDeleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('document_id', courseId);
      
      // Supprimer les mémo cartes associées au document
      const { error: flashcardListDeleteError } = await supabase
        .from('flashcard_lists')
        .delete()
        .eq('document_id', courseId);
      
      // Supprimer le document de la base de données
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', courseId);
      
      if (deleteError) throw deleteError;
      
      // Mettre à jour l'état pour retirer le document de la liste
      setCourses(courses.filter(course => course.id !== courseId));
      
      // Si le document supprimé était sélectionné, désélectionner
      if (selectedCourse === courseId) {
        setSelectedCourse(null);
        setPreviewOpen(false);
      }
      
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      alert('Erreur lors de la suppression du document. Veuillez réessayer.');
    }
  };
  
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
                    className='flex items-center w-full rounded-xl px-4 py-3 transition-all active:bg-[#68ccff]/20 hover:bg-[#68ccff]/10 hover:scale-105'
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

export default withAuth(MyCourseComponent); 