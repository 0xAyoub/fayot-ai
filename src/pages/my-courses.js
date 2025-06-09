import { useState, useEffect } from 'react';
import { NavBarComponent, SubscriptionBlock } from '../../components/NavBarComponent';
import { useRouter } from 'next/router';
import { FaCloudUploadAlt, FaPlus, FaArrowRight, FaGraduationCap, FaBrain, FaBook, FaLightbulb, FaStar, FaRocket, FaQuestionCircle, FaCrown, FaBars, FaRegFileAlt, FaRegListAlt, FaEye, FaFilePdf, FaImage } from 'react-icons/fa';
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
        <h1 className="text-xl font-bold text-[#106996]">Mes Cours</h1>
        <button 
          onClick={handleUploadCourse}
          className="bg-[#106996] text-[#ebebd7] text-sm font-medium py-1.5 px-3 rounded-xl shadow-sm flex items-center"
        >
          <FaPlus className="mr-1.5" /> Ajouter
        </button>
      </div>
      
      {/* Liste des cours - version compacte */}
      <div className="flex-grow overflow-y-auto mb-3">
        <div className="flex flex-col gap-2">
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
              className="bg-[#ebebd7] p-2 rounded-xl shadow-sm border border-[#68ccff]/30 relative flex h-16"
              onClick={() => setSelectedCourse(course.id)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: course.color }}></div>
              <div className="pl-1.5 flex-grow flex">
                <div className="flex flex-col justify-between flex-grow">
                  <h3 className="text-xs font-semibold text-[#106996] line-clamp-1">{course.title}</h3>
                  <div className="flex items-center text-[10px] text-gray-500">
                    {course.type === "pdf" ? 
                      <FaFilePdf className="w-2.5 h-2.5 mr-0.5 text-red-500" /> : 
                      <FaImage className="w-2.5 h-2.5 mr-0.5 text-blue-500" />
                    }
                    <span>{course.pages} pages</span>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateCards(course.id);
                      }}
                      className="bg-[#25a1e1]/10 text-[#25a1e1] text-[10px] font-medium py-0.5 px-1 rounded-md shadow-sm flex items-center"
                    >
                      <BsCardHeading className="mr-0.5 w-2 h-2" /> Mémo
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateQuiz(course.id);
                      }}
                      className="bg-[#106996]/10 text-[#106996] text-[10px] font-medium py-0.5 px-1 rounded-md shadow-sm flex items-center"
                    >
                      <FaQuestionCircle className="mr-0.5 w-2 h-2" /> QCM
                    </button>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewCourse(course.id);
                  }} 
                  className="flex-shrink-0 bg-[#68ccff]/10 text-[#25a1e1] p-0.5 rounded-md self-start ml-1"
                >
                  <FaEye className="w-2.5 h-2.5" />
                </button>
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewCourse(course.id);
                      }} 
                      className="flex-shrink-0 bg-[#68ccff]/20 text-[#25a1e1] p-1 rounded-md hover:bg-[#68ccff]/30 transition-all hover:scale-105"
                    >
                      <FaEye className="w-3 h-3" />
                    </button>
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
                    Sélectionne un cours pour voir les détails et créer des mémo cartes ou des QCM sur mesure !
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
                    className='flex items-center w-full rounded-xl px-4 py-3 transition-all duration-300 active:bg-[#68ccff]/20 bg-[#68ccff]/10'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaBook className="w-5 h-5 text-[#25a1e1]" />
                    <span className='ml-3 text-[16px] font-medium'>Mes cours</span>
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

export default withAuth(MyCourseComponent); 