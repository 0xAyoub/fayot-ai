import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NavBarComponent } from '../../../components/NavBarComponent';
import { supabase } from '../../utils/supabaseClient';
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaArrowLeft, FaTrophy, FaInfoCircle, FaFlag } from 'react-icons/fa';
import { withAuth } from '../../hoc/withAuth';
import Head from 'next/head';
import { CiMenuBurger } from 'react-icons/ci';

const shuffleArray = (array) => {
  // Crée une copie de l'array pour ne pas modifier l'original
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function QuizPage({ user }) {
  const router = useRouter();
  const { id } = router.query;
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState([]); // Pour suivre les réponses de l'utilisateur
  const [progress, setProgress] = useState(0);

  // Gestion de la vue mobile
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

  // Chargement du quiz et des questions
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;
      setIsLoading(true);
      
      try {
        console.log("Tentative de récupération du QCM avec ID:", id);
        
        // Récupérer les informations du quiz
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id);
        
        console.log("Résultat de la requête:", { quizData, quizError });
        
        // Au lieu d'utiliser .single() directement, vérifier manuellement
        if (quizError) {
          console.error("Erreur lors de la récupération du QCM:", quizError);
          throw quizError;
        }
        
        if (!quizData || quizData.length === 0) {
          console.error("Aucun QCM trouvé avec cet identifiant:", id);
          alert("QCM non trouvé. Vous allez être redirigé vers la liste des QCMs.");
          router.push('/my-qcm');
          return;
        }
        
        // Vérifier si le QCM appartient à l'utilisateur actuel
        const userQcm = quizData.find(item => item.user_id === user.id);
        if (!userQcm) {
          console.error("Ce QCM ne vous appartient pas ou n'existe pas");
          alert("Ce QCM ne vous appartient pas ou n'existe pas");
          router.push('/my-qcm');
          return;
        }
        
        console.log("QCM trouvé:", userQcm);
        setQuiz(userQcm);
        
        // Récupérer les questions du quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', id)
          .order('created_at');
        
        console.log("Questions trouvées:", { questionsData, questionsError });
        
        if (questionsError) {
          console.error("Erreur lors de la récupération des questions:", questionsError);
          throw questionsError;
        }
        
        // Formater les questions et mélanger les options
        const formattedQuestions = questionsData.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
        
        setQuestions(formattedQuestions);
        
        // Initialiser le tableau des réponses
        setAnswers(new Array(formattedQuestions.length).fill(null));
        
        // Mélanger les options de la première question
        if (formattedQuestions.length > 0) {
          setShuffledOptions(shuffleArray(formattedQuestions[0].options));
        }
        
      } catch (error) {
        console.error("Erreur lors du chargement du quiz:", error);
        alert("Impossible de charger le quiz. Vous allez être redirigé vers la liste des QCMs.");
        router.push('/my-qcm');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuiz();
  }, [id, router, user?.id]);

  // Mettre à jour la progression à chaque changement de question
  useEffect(() => {
    if (questions.length > 0) {
      setProgress(((currentQuestionIndex + 1) / questions.length) * 100);
    }
  }, [currentQuestionIndex, questions]);

  const handleOptionSelect = (option) => {
    if (showAnswer) return; // Empêcher de changer de réponse après avoir vu la correction
    setSelectedOption(option);
  };

  const checkAnswer = () => {
    if (!selectedOption) return; // Ne rien faire si aucune option n'est sélectionnée
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    
    // Mettre à jour le score et les réponses
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Enregistrer la réponse de l'utilisateur
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      selectedOption,
      isCorrect
    };
    setAnswers(newAnswers);
    
    setShowAnswer(true);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
      
      // Mélanger les options de la prochaine question
      const nextQuestionOptions = questions[currentQuestionIndex + 1].options;
      setShuffledOptions(shuffleArray(nextQuestionOptions));
    } else {
      // Quiz terminé
      setQuizCompleted(true);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      
      // Restaurer la réponse précédente si elle existe
      const prevAnswer = answers[currentQuestionIndex - 1];
      setSelectedOption(prevAnswer ? prevAnswer.selectedOption : null);
      setShowAnswer(!!prevAnswer);
      
      // Récupérer les options de la question précédente (déjà mélangées)
      const prevQuestionOptions = questions[currentQuestionIndex - 1].options;
      setShuffledOptions(prevQuestionOptions);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setScore(0);
    setQuizCompleted(false);
    setAnswers(new Array(questions.length).fill(null));
    
    // Mélanger les options de la première question
    if (questions.length > 0) {
      setShuffledOptions(shuffleArray(questions[0].options));
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#68ccff]/20 via-[#ebebd7] to-[#68ccff]/10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#25a1e1]"></div>
      </div>
    );
  }

  // Récupérer la question actuelle
  const currentQuestion = questions[currentQuestionIndex];

  const QuizContent = () => (
    <div className="w-full max-w-3xl mx-auto">
      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-[#106996] mb-1">
          <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
          <span>Score: {score}/{answers.filter(a => a && a.isCorrect).length}</span>
        </div>
        <div className="h-2 bg-[#68ccff]/30 rounded-full">
          <div
            className="h-2 bg-[#25a1e1] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-[#ebebd7] p-6 rounded-2xl border-2 border-[#68ccff]/30 shadow-md mb-6">
        <h2 className="text-xl font-bold text-[#106996] mb-3">
          {currentQuestion.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {shuffledOptions.map((option, index) => (
          <button
            key={index}
            className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
              selectedOption === option
                ? 'bg-[#25a1e1] text-white font-medium'
                : 'bg-white hover:bg-[#68ccff]/10 border border-[#68ccff]/30'
            } ${
              showAnswer
                ? option === currentQuestion.correct_answer
                  ? 'bg-green-500 text-white font-medium border-green-500'
                  : selectedOption === option
                  ? 'bg-red-500 text-white font-medium border-red-500'
                  : ''
                : ''
            }`}
            onClick={() => handleOptionSelect(option)}
            disabled={showAnswer}
          >
            <div className="flex items-center">
              <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full mr-3 ${
                selectedOption === option
                  ? 'bg-white text-[#25a1e1]'
                  : 'bg-[#68ccff]/20 text-[#25a1e1]'
              } ${
                showAnswer && option === currentQuestion.correct_answer
                  ? 'bg-white text-green-500'
                  : showAnswer && selectedOption === option
                  ? 'bg-white text-red-500'
                  : ''
              }`}>
                {['A', 'B', 'C', 'D'][index]}
              </div>
              <span>{option}</span>
              {showAnswer && option === currentQuestion.correct_answer && (
                <FaCheckCircle className="ml-auto text-green-500" />
              )}
              {showAnswer && selectedOption === option && option !== currentQuestion.correct_answer && (
                <FaTimesCircle className="ml-auto text-red-500" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Affichage de la correction */}
      {showAnswer && (
        <div className={`p-4 rounded-xl mb-6 ${
          selectedOption === currentQuestion.correct_answer
            ? 'bg-green-100 border border-green-300 text-green-800'
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          <div className="flex items-start">
            <FaInfoCircle className={`mt-1 mr-2 ${
              selectedOption === currentQuestion.correct_answer
                ? 'text-green-600'
                : 'text-red-600'
            }`} />
            <div>
              <p className="font-medium">
                {selectedOption === currentQuestion.correct_answer
                  ? 'Bonne réponse !'
                  : 'La réponse correcte est : ' + currentQuestion.correct_answer}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Boutons de navigation */}
      <div className="flex justify-between">
        <button
          onClick={goToPreviousQuestion}
          className={`flex items-center px-4 py-2 rounded-xl ${
            currentQuestionIndex === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#68ccff]/20 text-[#106996] hover:bg-[#68ccff]/30'
          }`}
          disabled={currentQuestionIndex === 0}
        >
          <FaArrowLeft className="mr-2" />
          Précédent
        </button>

        {!showAnswer ? (
          <button
            onClick={checkAnswer}
            className={`px-6 py-2 rounded-xl ${
              !selectedOption
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#25a1e1] text-white hover:bg-[#106996]'
            }`}
            disabled={!selectedOption}
          >
            Vérifier
          </button>
        ) : (
          <button
            onClick={goToNextQuestion}
            className="flex items-center px-6 py-2 bg-[#25a1e1] text-white rounded-xl hover:bg-[#106996]"
          >
            {currentQuestionIndex < questions.length - 1 ? (
              <>
                Suivant <FaArrowRight className="ml-2" />
              </>
            ) : (
              'Terminer le quiz'
            )}
          </button>
        )}
      </div>
    </div>
  );

  const QuizResults = () => (
    <div className="w-full max-w-3xl mx-auto bg-[#ebebd7] p-6 rounded-2xl border-2 border-[#68ccff]/30 shadow-md">
      <div className="text-center mb-6">
        <FaTrophy className="mx-auto text-yellow-500 text-5xl mb-4" />
        <h2 className="text-2xl font-bold text-[#106996] mb-2">Quiz terminé !</h2>
        <p className="text-lg text-[#106996]">
          Votre score: <span className="font-bold">{score}</span>/{questions.length}
        </p>
        
        {/* Message personnalisé en fonction du score */}
        <p className="mt-3 text-[#106996]">
          {score === questions.length ? 'Parfait ! Vous avez tout bon !' : 
           score >= questions.length * 0.8 ? 'Excellent travail !' :
           score >= questions.length * 0.6 ? 'Bon travail, continuez à vous améliorer !' :
           'Continuez à étudier, vous pouvez vous améliorer !'}
        </p>
      </div>
      
      {/* Récapitulatif des réponses */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#106996] mb-3">Récapitulatif</h3>
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={index} className={`p-3 rounded-lg flex items-start ${
              answers[index] && answers[index].isCorrect
                ? 'bg-green-100 border border-green-200'
                : 'bg-red-100 border border-red-200'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                answers[index] && answers[index].isCorrect
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {answers[index] && answers[index].isCorrect ? '✓' : '✗'}
              </div>
              <div className="flex-grow">
                <p className="font-medium text-sm">{question.question}</p>
                {answers[index] && !answers[index].isCorrect && (
                  <div className="mt-1 text-xs">
                    <p className="text-red-800">Votre réponse: {answers[index].selectedOption}</p>
                    <p className="text-green-800">Réponse correcte: {question.correct_answer}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={restartQuiz}
          className="px-6 py-3 bg-[#25a1e1] text-white font-medium rounded-xl hover:bg-[#106996] transition-colors"
        >
          Recommencer le quiz
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-[#68ccff]/20 via-[#ebebd7] to-[#68ccff]/10">
      <Head>
        <title>{quiz ? quiz.title : 'Quiz'} | Fayot</title>
      </Head>
      
      {/* Nav sidebar (desktop only) */}
      {!isMobile && <NavBarComponent user={user} />}
      
      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex justify-between items-center px-3 py-2 bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-lg hover:bg-[#68ccff]/20"
            >
              <FaArrowLeft className="w-3 h-3" />
            </button>
            <h1 className="text-lg font-bold text-[#25a1e1] truncate">
              {quiz ? quiz.title : 'Quiz'}
            </h1>
            <button
              onClick={toggleMenu}
              className="p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-xl hover:bg-[#68ccff]/20"
            >
              <CiMenuBurger className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Desktop header */}
        {!isMobile && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 flex items-center p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-lg hover:bg-[#68ccff]/20"
              >
                <FaArrowLeft className="w-3 h-3 mr-1" />
                <span className="text-sm font-medium">Retour</span>
              </button>
              <h1 className="text-2xl font-bold text-[#25a1e1]">
                {quiz ? quiz.title : 'Quiz'}
              </h1>
            </div>
          </div>
        )}
        
        {/* Quiz content or results */}
        {questions.length > 0 ? (
          quizCompleted ? <QuizResults /> : <QuizContent />
        ) : (
          <div className="w-full text-center p-6">
            <p className="text-[#106996] text-lg">Aucune question trouvée pour ce quiz.</p>
          </div>
        )}
      </main>
      
      {/* Mobile menu */}
      {isMobile && isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-72 bg-[#ebebd7] shadow-xl z-40 rounded-l-2xl border-l-2 border-[#68ccff]/30 transform transition-all duration-300 ease-in-out">
            <div className="p-5 pt-16">
              <div className="mb-6 flex items-center justify-center">
                <img src="/fayotlogo.png" alt="Logo Fayot" className="h-10" />
              </div>
              <NavBarComponent isInMobileMenu={true} closeMenu={() => setIsMenuOpen(false)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default withAuth(QuizPage);
