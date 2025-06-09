import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaCheck, FaRedo, FaDownload, FaShareAlt, FaMagic, FaTrophy, FaRocket, FaSync, FaBrain, FaBookmark, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CiHome, CiMenuBurger } from "react-icons/ci";
import Link from 'next/link';
import { NavBarComponent } from '../../../../components/NavBarComponent';
import { withAuth } from '../../../hoc/withAuth';
import { supabase } from '../../../utils/supabaseClient';

function QcmResults({ user }) {
  const router = useRouter();
  const { id } = router.query;
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [showDownload, setShowDownload] = useState(false);
  const [error, setError] = useState('');
  const questionRef = useRef(null);

  // Récupérer les questions du QCM depuis Supabase
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;
      
      try {
        // Récupérer les détails du quiz
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (quizError) throw quizError;
        setQuiz(quizData);
        
        // Récupérer les questions associées à ce quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', id)
          .order('id', { ascending: true });
        
        if (questionsError) throw questionsError;
        
        // Formater les questions pour l'affichage
        const formattedQuestions = questionsData.map(question => ({
          id: question.id,
          question: question.question,
          options: JSON.parse(question.options),
          correctOptions: JSON.parse(question.correct_options),
          explanation: question.explanation || ""
        }));
        
        setQuestions(formattedQuestions);
        setLoadingQuestions(false);
      } catch (error) {
        console.error('Erreur lors de la récupération du QCM:', error);
        setError('Impossible de charger le QCM. Veuillez réessayer.');
        setLoadingQuestions(false);
      }
    };
    
    fetchQuiz();
  }, [id]);
  
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

  const handleOptionSelect = (optionIndex) => {
    if (isSubmitted) return;
    
    setSelectedOptions(prev => {
      const currentQuestion = questions[currentQuestionIndex];
      const currentSelectedOptions = prev[currentQuestion.id] || [];
      
      // Si l'option est déjà sélectionnée, la retirer
      if (currentSelectedOptions.includes(optionIndex)) {
        return {
          ...prev,
          [currentQuestion.id]: currentSelectedOptions.filter(index => index !== optionIndex)
        };
      }
      
      // Sinon, l'ajouter
      return {
        ...prev,
        [currentQuestion.id]: [...currentSelectedOptions, optionIndex]
      };
    });
  };

  const isOptionSelected = (optionIndex) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return false;
    
    const selectedOptionsForQuestion = selectedOptions[currentQuestion.id] || [];
    return selectedOptionsForQuestion.includes(optionIndex);
  };

  const isOptionCorrect = (optionIndex) => {
    if (!isSubmitted) return false;
    
    const currentQuestion = questions[currentQuestionIndex];
    return currentQuestion.correctOptions.includes(optionIndex);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (isSubmitted) {
      // Réinitialiser le quiz
      setIsSubmitted(false);
      setSelectedOptions({});
      setScore(0);
      setCurrentQuestionIndex(0);
      return;
    }
    
    // Calculer le score
    let totalCorrect = 0;
    
    questions.forEach(question => {
      const userSelected = selectedOptions[question.id] || [];
      const correctOptions = question.correctOptions;
      
      // Vérifier si les options sélectionnées correspondent exactement aux options correctes
      if (
        userSelected.length === correctOptions.length && 
        userSelected.every(option => correctOptions.includes(option))
      ) {
        totalCorrect += 1;
      }
    });
    
    const finalScore = Math.round((totalCorrect / questions.length) * 100);
    setScore(finalScore);
    setIsSubmitted(true);
  };

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex] || { 
      question: "Chargement...", 
      options: ["Chargement..."], 
      correctOptions: [], 
      explanation: "" 
    };
  };

  const currentQuestion = getCurrentQuestion();
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Générer un PDF du QCM
  const generatePDF = async () => {
    // Cette fonction serait implémentée pour exporter en PDF
    alert("Téléchargement PDF - Fonctionnalité à implémenter");
  };

  // Interface mobile
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
            <span className="mr-2">QCM</span>
          </h1>
          {/* Barre de progression intégrée */}
          <div className="ml-3 flex items-center">
            <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-1">
              <div className="bg-[#25a1e1] h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs font-medium text-gray-500">{currentQuestionIndex + 1}/{questions.length}</span>
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
        {loadingQuestions ? (
          <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 flex-grow flex flex-col items-center justify-center p-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#25a1e1] mb-3"></div>
            <p className="text-gray-700 font-semibold">Chargement du QCM...</p>
            <p className="text-xs text-gray-500 mt-1 font-light">Nous récupérons tes questions</p>
          </div>
        ) : error ? (
          <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-red-200 flex-grow flex flex-col items-center justify-center p-4">
            <p className="text-red-500 font-semibold">{error}</p>
            <button 
              onClick={() => router.push('/format-selection')}
              className="mt-4 bg-[#25a1e1] text-[#ebebd7] px-4 py-2 rounded-lg hover:bg-[#106996] transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            {showDownload ? (
              <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 flex-grow flex flex-col p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-gray-800">Télécharge ton QCM</h2>
                  <button 
                    onClick={() => setShowDownload(false)}
                    className="text-[#25a1e1] text-sm bg-[#68ccff]/10 px-2 py-1 rounded-lg hover:bg-[#68ccff]/20"
                  >
                    <FaArrowLeft className="inline w-3 h-3 mr-1" /> Retour
                  </button>
                </div>
                
                <div className="bg-[#68ccff]/10 p-3 rounded-xl border border-[#68ccff]/30 hover:shadow-md transition-all duration-300 transform hover:scale-[1.01] cursor-pointer">
                  <h3 className="font-semibold text-gray-800 mb-1">Format PDF</h3>
                  <p className="text-xs text-gray-500 mb-2 font-light">Pour imprimer ou partager facilement</p>
                  <button 
                    className="w-full bg-[#25a1e1] text-[#ebebd7] text-sm py-1.5 rounded-lg hover:bg-[#106996] transition-colors duration-300 flex items-center justify-center font-bold"
                    onClick={generatePDF}
                  >
                    <FaDownload className="w-3 h-3 mr-1" /> Télécharger PDF
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Question et options */}
                <div className="flex-grow flex flex-col">
                  <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 p-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{currentQuestion.question}</h3>
                    
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <div 
                          key={index}
                          onClick={() => handleOptionSelect(index)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200
                            ${isOptionSelected(index) && !isSubmitted 
                              ? 'bg-[#68ccff]/20 border-[#25a1e1]' 
                              : isSubmitted && isOptionCorrect(index) && isOptionSelected(index)
                                ? 'bg-green-100 border-green-500'
                                : isSubmitted && isOptionCorrect(index)
                                  ? 'bg-green-50 border-green-300'
                                  : isSubmitted && isOptionSelected(index)
                                    ? 'bg-red-100 border-red-500'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-6 h-6 flex-shrink-0 rounded-full border flex items-center justify-center mr-3
                              ${isOptionSelected(index) && !isSubmitted 
                                ? 'border-[#25a1e1] bg-[#68ccff]/10' 
                                : isSubmitted && isOptionCorrect(index)
                                  ? 'border-green-500 bg-green-100'
                                  : isSubmitted && isOptionSelected(index)
                                    ? 'border-red-500 bg-red-100'
                                    : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isOptionSelected(index) && !isSubmitted && (
                                <div className="w-3 h-3 rounded-full bg-[#25a1e1]"></div>
                              )}
                              {isSubmitted && isOptionCorrect(index) && (
                                <FaCheck className="w-3 h-3 text-green-500" />
                              )}
                            </div>
                            <span className={`text-sm
                              ${isSubmitted && isOptionCorrect(index)
                                ? 'font-medium text-green-700'
                                : isSubmitted && isOptionSelected(index)
                                  ? 'font-medium text-red-700'
                                  : 'text-gray-700'
                              }`}
                            >
                              {option}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {isSubmitted && currentQuestion.explanation && (
                      <div className="mt-4 p-3 bg-[#68ccff]/10 rounded-lg border border-[#68ccff]/30">
                        <h4 className="font-medium text-[#106996] text-sm mb-1">Explication:</h4>
                        <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                      </div>
                    )}
                  </div>

                  {/* Affichage du score si le quiz est terminé */}
                  {isSubmitted && (
                    <div className="bg-[#ebebd7] rounded-xl p-3 border border-[#68ccff]/30 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-800 text-sm">Ton score:</h4>
                        <span className={`font-bold text-lg ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation des questions et actions */}
                <div className="py-2">
                  {/* Points indicateurs et flèches */}
                  <div className="flex justify-between items-center mb-2">
                    <button 
                      onClick={goToPrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className={`w-10 h-10 bg-[#ebebd7] border border-[#68ccff]/30 text-[#25a1e1] rounded-full flex items-center justify-center shadow-sm transition-all duration-300
                        ${currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#68ccff]/10'}`}
                    >
                      <FaChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex space-x-0.5">
                      {questions.map((_, index) => (
                        <div 
                          key={index} 
                          className={`w-1.5 h-1.5 rounded-full ${currentQuestionIndex === index ? 'bg-[#25a1e1]' : 'bg-gray-300'}`}
                        />
                      ))}
                    </div>
                    
                    <button 
                      onClick={goToNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className={`w-10 h-10 bg-[#25a1e1] text-[#ebebd7] rounded-full flex items-center justify-center shadow-md transition-all duration-300
                        ${currentQuestionIndex === questions.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#106996]'}`}
                    >
                      <FaChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Boutons d'action */}
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="bg-[#ebebd7] border border-[#68ccff]/30 text-[#25a1e1] rounded-xl py-2 px-3 text-sm font-medium flex items-center justify-center shadow-sm hover:bg-[#68ccff]/10"
                      onClick={() => isSubmitted ? handleSubmit() : setShowDownload(true)}
                    >
                      {isSubmitted ? (
                        <>
                          <FaRedo className="w-3 h-3 mr-1.5" />
                          <span className="font-semibold">Recommencer</span>
                        </>
                      ) : (
                        <>
                          <FaDownload className="w-3 h-3 mr-1.5" />
                          <span className="font-semibold">Télécharger</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitted}
                      className={`bg-[#25a1e1] text-[#ebebd7] rounded-xl py-2 px-3 text-sm font-medium flex items-center justify-center shadow-md
                        ${isSubmitted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#106996]'}`}
                    >
                      <FaCheck className="w-3 h-3 mr-1.5" />
                      <span className="font-bold">Valider</span>
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
      {/* Header simplifié */}
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
            <span className="mr-2">QCM</span>
          </h1>
          <div className="ml-4 bg-[#68ccff]/10 rounded-full px-3 py-1 flex items-center">
            <span className="text-xs font-medium text-[#106996]">{questions.length} questions</span>
          </div>
        </div>
        
        {/* Actions déplacées ici */}
        <div className="flex space-x-2">
          {isSubmitted ? (
            <button 
              className="bg-[#ebebd7] border border-[#68ccff]/30 text-[#25a1e1] rounded-lg py-2 px-3 text-sm font-medium flex items-center shadow-sm hover:bg-[#68ccff]/10 hover:scale-105 transition-all duration-300"
              onClick={handleSubmit}
            >
              <FaRedo className="w-3 h-3 mr-2" />
              Recommencer
            </button>
          ) : (
            <button 
              onClick={() => setShowDownload(true)}
              className="bg-[#ebebd7] border border-[#68ccff]/30 text-[#25a1e1] rounded-lg py-2 px-3 text-sm font-medium flex items-center shadow-sm hover:bg-[#68ccff]/10 hover:scale-105 transition-all duration-300"
            >
              <FaDownload className="w-3 h-3 mr-2" />
              Télécharger
            </button>
          )}
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitted}
            className={`bg-[#25a1e1] text-[#ebebd7] rounded-lg py-2 px-3 text-sm font-medium flex items-center shadow-md hover:bg-[#106996] hover:scale-105 transition-all duration-300
              ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FaCheck className="w-3 h-3 mr-2" />
            Valider
          </button>
          
          <button 
            className="bg-[#106996] text-[#ebebd7] rounded-lg py-2 px-3 text-sm font-medium flex items-center shadow-md hover:bg-[#25a1e1] hover:scale-105 transition-all duration-300"
          >
            <FaShareAlt className="w-3 h-3 mr-2" />
            Partager
          </button>
        </div>
      </div>
      
      {/* Main content with questions and sidebar */}
      <div className="flex flex-1 gap-4 h-[calc(100%-3rem)] overflow-hidden">
        {/* Main central section with questions */}
        <div className="flex-1 flex flex-col rounded-2xl">
          {loadingQuestions ? (
            <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 flex-grow flex flex-col items-center justify-center p-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#25a1e1] mb-3"></div>
              <p className="text-gray-700 font-medium">Chargement du QCM...</p>
              <p className="text-xs text-gray-500 mt-1">Nous récupérons tes questions</p>
            </div>
          ) : error ? (
            <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-red-200 flex-grow flex flex-col items-center justify-center p-4">
              <p className="text-red-500 font-semibold">{error}</p>
              <button 
                onClick={() => router.push('/format-selection')}
                className="mt-4 bg-[#25a1e1] text-[#ebebd7] px-4 py-2 rounded-lg hover:bg-[#106996] transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className="flex-grow flex flex-col bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 overflow-hidden">
              {/* Question et options */}
              <div className="flex-grow overflow-auto p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentQuestion.question}</h2>
                
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, index) => (
                    <div 
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
                        ${isOptionSelected(index) && !isSubmitted 
                          ? 'bg-[#68ccff]/20 border-[#25a1e1]' 
                          : isSubmitted && isOptionCorrect(index) && isOptionSelected(index)
                            ? 'bg-green-100 border-green-500'
                            : isSubmitted && isOptionCorrect(index)
                              ? 'bg-green-50 border-green-300'
                              : isSubmitted && isOptionSelected(index)
                                ? 'bg-red-100 border-red-500'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-7 h-7 flex-shrink-0 rounded-full border flex items-center justify-center mr-4
                          ${isOptionSelected(index) && !isSubmitted 
                            ? 'border-[#25a1e1] bg-[#68ccff]/10' 
                            : isSubmitted && isOptionCorrect(index)
                              ? 'border-green-500 bg-green-100'
                              : isSubmitted && isOptionSelected(index)
                                ? 'border-red-500 bg-red-100'
                                : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isOptionSelected(index) && !isSubmitted && (
                            <div className="w-3.5 h-3.5 rounded-full bg-[#25a1e1]"></div>
                          )}
                          {isSubmitted && isOptionCorrect(index) && (
                            <FaCheck className="w-3.5 h-3.5 text-green-500" />
                          )}
                        </div>
                        <span className={`text-base
                          ${isSubmitted && isOptionCorrect(index)
                            ? 'font-medium text-green-700'
                            : isSubmitted && isOptionSelected(index)
                              ? 'font-medium text-red-700'
                              : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {isSubmitted && currentQuestion.explanation && (
                  <div className="p-4 bg-[#68ccff]/10 rounded-lg border border-[#68ccff]/30">
                    <h4 className="font-medium text-[#106996] text-base mb-2">Explication:</h4>
                    <p className="text-gray-700">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
              
              {/* Controls under the question */}
              <div className="p-3 border-t border-[#68ccff]/30 bg-[#68ccff]/10">
                <div className="flex justify-between items-center">
                  <button 
                    onClick={goToPrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`w-10 h-10 bg-[#ebebd7] border border-[#68ccff]/30 text-[#25a1e1] rounded-full flex items-center justify-center shadow-sm transition-all duration-300
                      ${currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#68ccff]/10'}`}
                  >
                    <FaChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {questions.map((_, index) => (
                      <div 
                        key={index} 
                        className={`w-2 h-2 rounded-full ${currentQuestionIndex === index ? 'bg-[#25a1e1]' : 'bg-gray-300'}`}
                      />
                    ))}
                  </div>
                  
                  <button 
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className={`w-10 h-10 bg-[#25a1e1] text-[#ebebd7] rounded-full flex items-center justify-center shadow-md transition-all duration-300
                      ${currentQuestionIndex === questions.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#106996]'}`}
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
                <span className="text-sm text-gray-500">Question</span>
                <span className="text-sm font-bold text-[#25a1e1]">{currentQuestionIndex + 1}/{questions.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-[#25a1e1] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            
            {isSubmitted && (
              <div className="bg-[#68ccff]/10 rounded-lg p-3 flex items-start">
                <FaTrophy className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-[#106996] mb-1">Ton score: {score}%</p>
                  <p className="text-xs text-[#106996]">
                    {score >= 80 
                      ? "Excellent travail ! Tu maîtrises très bien ce sujet." 
                      : score >= 60 
                        ? "Bon travail ! Continue à t'améliorer." 
                        : "Continue à réviser pour améliorer ton score."}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Download section in sidebar */}
          <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Télécharger</h2>
            <button 
              className="w-full bg-[#25a1e1] text-[#ebebd7] py-2 px-3 rounded-lg hover:bg-[#106996] transition-all duration-300 flex items-center justify-center"
              onClick={generatePDF}
            >
              <FaDownload className="w-3 h-3 mr-2" />
              <span className="font-medium">Format PDF</span>
            </button>
          </div>
          
          {/* Tips section */}
          <div className="bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 p-4 flex-grow overflow-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Astuces</h2>
            <div className="space-y-2">
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                <p className="text-sm text-yellow-800">
                  <span className="font-bold block mb-1">Conseil</span>
                  Les questions peuvent avoir une, deux ou trois bonnes réponses. Sélectionne toutes les réponses que tu penses correctes.
                </p>
              </div>
              <div className="bg-[#68ccff]/10 rounded-lg p-3 border border-[#68ccff]/30 mt-2">
                <p className="text-sm text-[#106996]">
                  <span className="font-bold block mb-1">Optimise ton apprentissage</span>
                  Prends le temps de lire attentivement les explications après chaque question pour mieux comprendre le sujet.
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

export default withAuth(QcmResults);
