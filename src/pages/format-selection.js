import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { FaQuestionCircle, FaRocket, FaArrowLeft, FaCrown, FaMagic, FaBrain, FaCheck, FaStar, FaBook, FaUpload, FaFile, FaHome, FaStickyNote, FaUserAlt, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { BsCardHeading, BsQuestionCircleFill } from 'react-icons/bs';
import { CiMenuBurger } from "react-icons/ci";
import Link from 'next/link';
import { NavBarComponent } from '../../components/NavBarComponent';
import { withAuth } from '../hoc/withAuth';
import { supabase } from '../utils/supabaseClient';

// Déplacer la fonction getFileIcon en dehors de FormatSelection
const getFileIcon = (type) => {
  switch(type) {
    case 'pdf':
      return <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">PDF</div>;
    case 'doc':
      return <div className="w-10 h-10 bg-[#68ccff]/20 rounded-full flex items-center justify-center text-[#25a1e1]">DOC</div>;
    case 'image':
      return <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">IMG</div>;
    default:
      return <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">FILE</div>;
  }
};

function FormatSelection({ user }) {
  const router = useRouter();
  const { courseId, format } = router.query;
  const fileInputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('memo'); // Défini par défaut sur 'memo'
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoverCard, setHoverCard] = useState(null);
  const [cardCount, setCardCount] = useState(10); // Nombre de mémo cartes à générer
  const [difficultParts, setDifficultParts] = useState('');
  const [importedFile, setImportedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Définir le format sélectionné depuis l'URL
  useEffect(() => {
    if (format && (format === 'memo' || format === 'qcm')) {
      setSelectedFormat(format);
    }
  }, [format]);
  
  // Vérifier si un courseId est fourni et charger le fichier correspondant
  useEffect(() => {
    const fetchCourseFile = async () => {
      if (!courseId) return;
      
      try {
        // Récupérer les détails du document depuis Supabase
        const { data: document, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (error) throw error;
        
        // Récupérer le fichier depuis le chemin stocké
        const filePath = document.file_path;
        const fileName = document.title;
        const fileType = document.file_type;
        
        // Vous devriez implémenter ici la logique pour récupérer le fichier réel
        // Pour l'instant, nous allons simuler l'importation du fichier
        
        // Formater comme si l'utilisateur avait importé le fichier
        setImportedFile({
          name: fileName,
          type: fileType === 'pdf' ? 'pdf' : 'image',
          size: `${(document.file_size / (1024 * 1024)).toFixed(2)} MB`,
          date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          documentId: document.id // Stocker l'ID du document pour référence
        });
        
      } catch (error) {
        console.error('Erreur lors de la récupération du fichier:', error);
        setFileError('Impossible de charger le fichier associé au cours.');
      }
    };
    
    if (courseId) {
      fetchCourseFile();
    }
  }, [courseId]);
  
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

  const handleFormatSelect = (format) => {
    if (format === 'memo' || format === 'qcm') {
      setSelectedFormat(format);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type de fichier (PDF ou image)
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      setFileError('Seuls les fichiers PDF et images sont acceptés');
      return;
    }

    // Limiter la taille du fichier (par exemple, 10 Mo)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Le fichier est trop volumineux (max 10 Mo)');
      return;
    }

    setFileError('');
    
    // Déterminer le type pour l'affichage
    let fileType = 'default';
    if (file.type === 'application/pdf') fileType = 'pdf';
    else if (file.type.startsWith('image/')) fileType = 'image';
    
    setImportedFile({
      file: file,
      name: file.name,
      type: fileType,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  const handleLaunch = async () => {
    if (!selectedFormat || !importedFile) {
      setFileError('Veuillez sélectionner un fichier avant de générer les mémo cartes');
      return;
    }
    
    setIsGenerating(true);
    setUploadProgress(10);

    try {
      // Récupérer le token d'authentification de l'utilisateur depuis Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
      }
      
      const token = session.access_token;
      
      let requestData;
      
      // Si nous avons un documentId (venant de my-courses), on l'utilise directement
      if (importedFile.documentId) {
        // Créer un objet FormData avec l'ID du document existant
        requestData = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            documentId: importedFile.documentId,
            userId: user.id,
            numberOfCards: cardCount,
            difficultParts: difficultParts || ''
          })
        };
      } else {
        // Sinon, on envoie le fichier comme avant
        const formData = new FormData();
        formData.append('file', importedFile.file);
        formData.append('userId', user.id);
        formData.append('numberOfCards', cardCount);
        if (difficultParts) {
          formData.append('difficultParts', difficultParts);
        }
        
        requestData = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        };
      }
      
      setUploadProgress(30);
      
      // Appeler l'API appropriée en fonction du format sélectionné
      const endpoint = selectedFormat === 'memo' ? '/api/api_memocards' : '/api/api_qcm';
      
      const response = await fetch(endpoint, requestData);
      
      setUploadProgress(70);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }
      
      const data = await response.json();
      setUploadProgress(100);
      
      // Rediriger vers la page des résultats appropriée
      if (selectedFormat === 'memo') {
        router.push(`/results/memocards/${data.flashcardList.id}`);
      } else {
        router.push(`/results/qcm/${data.quizId}`);
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      setFileError(error.message);
      setIsGenerating(false);
      setUploadProgress(0);
    }
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
      
      {/* Document importé ou zone de téléchargement */}
      {importedFile ? (
        <div className="bg-[#ebebd7] rounded-xl shadow-sm border border-[#68ccff]/30 p-2 mb-2 flex items-center">
          <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-semibold flex-shrink-0">
            {importedFile.type === 'pdf' ? 'PDF' : importedFile.type === 'image' ? 'IMG' : 'FILE'}
          </div>
          <div className="ml-2 flex-grow overflow-hidden">
            <p className="font-semibold text-gray-800 text-sm truncate">{importedFile.name}</p>
            <p className="text-xs text-gray-500 font-light truncate">{importedFile.size} • {importedFile.date}</p>
          </div>
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
            <FaCheck className="w-2.5 h-2.5 mr-0.5" /> Prêt
          </span>
        </div>
      ) : (
        <div 
          className="bg-[#ebebd7] rounded-xl shadow-sm border border-dashed border-[#68ccff] p-3 mb-2 flex flex-col items-center justify-center cursor-pointer hover:bg-[#68ccff]/5"
          onClick={triggerFileInput}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,image/*"
          />
          <FaUpload className="w-5 h-5 text-[#25a1e1] mb-1" />
          <p className="text-sm font-medium text-gray-700">Importer un document</p>
          <p className="text-xs text-gray-500 mt-1">PDF ou image, max 10 MB</p>
          {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
        </div>
      )}

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
              className={`${selectedFormat === 'memo' 
                ? 'border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30' 
                : 'border border-gray-200'} rounded-lg p-2 flex items-center shadow-sm cursor-pointer`}
              onClick={() => handleFormatSelect('memo')}
            >
              <div className={`w-8 h-8 ${selectedFormat === 'memo' ? 'bg-[#68ccff]/20' : 'bg-gray-100'} rounded-full flex items-center justify-center mr-2`}>
                <BsCardHeading className={`w-4 h-4 ${selectedFormat === 'memo' ? 'text-[#25a1e1]' : 'text-gray-500'}`} />
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-semibold text-gray-800">mémo cartes</h4>
                <p className="text-xs text-gray-600 font-medium">Pour réviser efficacement</p>
              </div>
              {selectedFormat === 'memo' && (
                <div className="w-5 h-5 bg-[#25a1e1] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#ebebd7]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* QCM désactivé - MODIFIÉ POUR ACTIVER */}
            <div 
              className={`border ${selectedFormat === 'qcm' ? 'border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30' : 'border-gray-200'} rounded-lg p-2 flex items-center shadow-sm cursor-pointer`}
              onClick={() => handleFormatSelect('qcm')}
            >
              <div className={`w-8 h-8 ${selectedFormat === 'qcm' ? 'bg-[#68ccff]/20' : 'bg-gray-100'} rounded-full flex items-center justify-center mr-2`}>
                <BsQuestionCircleFill className={`w-4 h-4 ${selectedFormat === 'qcm' ? 'text-[#25a1e1]' : 'text-gray-500'}`} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">QCM</h4>
                <p className="text-xs text-gray-600 font-medium">Teste tes connaissances</p>
              </div>
              {selectedFormat === 'qcm' && (
                <div className="ml-auto w-5 h-5 bg-[#25a1e1] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#ebebd7]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Nombre de mémo cartes */}
        <div className="bg-[#ebebd7] border border-[#68ccff]/30 rounded-xl p-2 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              {selectedFormat === 'memo' ? 'Nombre de mémo cartes' : 'Nombre de questions'}
            </h3>
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
        disabled={isGenerating || !importedFile}
        onClick={handleLaunch}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#ebebd7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-semibold">Préparation en cours... {uploadProgress}%</span>
          </>
        ) : (
          <>
            <FaRocket className="w-4 h-4 mr-2" />
            <span className="font-bold">
              Générer {cardCount} {selectedFormat === 'memo' ? 'mémo cartes' : 'questions de QCM'}
            </span>
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
      {importedFile ? (
        <div className="bg-[#ebebd7] p-3 rounded-xl shadow-md border border-[#68ccff]/30 mb-6">
          <div className="flex items-center">
            {getFileIcon(importedFile.type)}
            <div className="ml-3">
              <p className="font-semibold text-gray-800">{importedFile.name}</p>
              <p className="text-sm text-gray-500 font-light">{importedFile.size} • {importedFile.date}</p>
            </div>
            <div className="ml-auto flex items-center">
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full flex items-center mr-3">
                <FaCheck className="w-3 h-3 mr-1" /> Prêt
              </span>
              <button 
                onClick={triggerFileInput}
                className="bg-[#68ccff]/10 text-[#25a1e1] text-xs font-medium px-3 py-1 rounded-lg hover:bg-[#68ccff]/20"
              >
                Changer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="bg-[#ebebd7] p-6 rounded-xl shadow-md border border-dashed border-[#68ccff] mb-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#68ccff]/5 transition-all duration-300"
          onClick={triggerFileInput}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,image/*"
          />
          <FaUpload className="w-8 h-8 text-[#25a1e1] mb-2" />
          <p className="text-lg font-medium text-gray-700">Importer un document</p>
          <p className="text-sm text-gray-500 mt-1">Formats acceptés: PDF, JPG, PNG (max 10 MB)</p>
          {fileError && <p className="text-sm text-red-500 mt-3">{fileError}</p>}
        </div>
      )}
      
      {/* Grid 2x2 pour les 4 catégories principales */}
      <div className="grid grid-cols-2 gap-6 flex-grow">
        {/* Format */}
        <div className="bg-[#ebebd7] p-4 rounded-xl shadow-md border border-[#68ccff]/30">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Format d'étude</h2>
          
          <div 
            className={`${selectedFormat === 'memo' 
              ? 'border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30' 
              : 'border border-gray-200'} rounded-xl p-4 shadow-md flex items-center cursor-pointer`}
            onClick={() => handleFormatSelect('memo')}
          >
            <div className={`w-12 h-12 ${selectedFormat === 'memo' ? 'bg-[#68ccff]/20' : 'bg-gray-100'} rounded-full flex items-center justify-center mr-4 shadow-sm`}>
              <BsCardHeading className={`w-6 h-6 ${selectedFormat === 'memo' ? 'text-[#25a1e1]' : 'text-gray-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">mémo cartes</h3>
              <p className="text-sm text-gray-600 font-medium">Parfaites pour réviser efficacement</p>
            </div>
            {selectedFormat === 'memo' && (
              <div className="ml-auto">
                <div className="w-6 h-6 bg-[#25a1e1] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#ebebd7]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          
          {/* QCM version desktop - MODIFIÉ POUR ACTIVER */}
          <div 
            className={`border ${selectedFormat === 'qcm' ? 'border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30' : 'border-gray-200'} rounded-xl p-4 shadow-sm flex items-center cursor-pointer mt-4`}
            onClick={() => handleFormatSelect('qcm')}
          >
            <div className={`w-12 h-12 ${selectedFormat === 'qcm' ? 'bg-[#68ccff]/20' : 'bg-gray-100'} rounded-full flex items-center justify-center mr-4 shadow-sm`}>
              <BsQuestionCircleFill className={`w-6 h-6 ${selectedFormat === 'qcm' ? 'text-[#25a1e1]' : 'text-gray-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">QCM</h3>
              <p className="text-sm text-gray-600 font-medium">Teste tes connaissances</p>
            </div>
            {selectedFormat === 'qcm' && (
              <div className="ml-auto">
                <div className="w-6 h-6 bg-[#25a1e1] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#ebebd7]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Nombre de mémo cartes */}
        <div className="bg-[#ebebd7] p-4 rounded-xl shadow-md border border-[#68ccff]/30">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Nombre de mémo cartes</h2>
          
          <div className="mb-6">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">
                  Peu {selectedFormat === 'memo' ? 'de cartes' : 'de questions'}
                </span>
                <span className="text-lg font-bold text-[#25a1e1]">{cardCount}</span>
                <span className="text-sm text-gray-500 font-medium">
                  Beaucoup {selectedFormat === 'memo' ? 'de cartes' : 'de questions'}
                </span>
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
          
          {isGenerating && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-[#25a1e1] h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
          
          <button
            className={`bg-[#25a1e1] text-[#ebebd7] font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg w-full flex items-center justify-center
              ${(isGenerating || !importedFile) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#106996]'}`}
            disabled={isGenerating || !importedFile}
            onClick={handleLaunch}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#ebebd7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-semibold">Préparation en cours... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <FaRocket className="w-5 h-5 mr-3" />
                <span className="font-bold">
                  Générer {cardCount} {selectedFormat === 'memo' ? 'mémo cartes' : 'questions de QCM'}
                </span>
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
      </div>
    </div>
  );
}

export default withAuth(FormatSelection);