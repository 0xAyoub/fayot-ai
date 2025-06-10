import { useState, useEffect, useRef } from 'react';
import { NavBarComponent, SubscriptionBlock } from './NavBarComponent';
import { useRouter } from 'next/router';
import { FaCloudUploadAlt, FaCamera, FaArrowRight, FaGraduationCap, FaBrain, FaBook, FaLightbulb, FaStar, FaRocket, FaQuestionCircle, FaCrown, FaCheck, FaMagic, FaArrowLeft, FaHome, FaStickyNote, FaUserAlt, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { CiMenuBurger } from "react-icons/ci";
import { BsCardHeading, BsQuestionCircleFill } from 'react-icons/bs';
import Link from 'next/link';
import { supabase } from '../src/utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Fonction utilitaire pour obtenir l'icône de fichier
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

// Fonction pour déterminer le type MIME en fonction de l'extension
function getMimeType(extension) {
  const ext = extension.toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

export const HomeComponent = ({ user }) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  // États ajoutés de format-selection.js
  const [selectedFormat, setSelectedFormat] = useState('memo');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoverCard, setHoverCard] = useState(null);
  const [cardCount, setCardCount] = useState(10);
  const [difficultParts, setDifficultParts] = useState('');
  const [importedFile, setImportedFile] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload' ou 'configure'
  
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

  // Fonction pour gérer la déconnexion
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  // Fonction pour gérer la sélection du format
  const handleFormatSelect = (format) => {
    if (format === 'memo' || format === 'qcm') {
      setSelectedFormat(format);
    }
  };

  // Fonction pour uploader un fichier à Supabase Storage
  const uploadToSupabaseStorage = async (fileBuffer, fileName, userId) => {
    const fileExt = path.extname(fileName);
    const uniqueFileName = `${Date.now()}-${uuidv4()}${fileExt}`;
    const filePath = `${userId}/${uniqueFileName}`;

    try {
      // Obtenir le token d'authentification de l'utilisateur
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Impossible de récupérer le token d\'authentification');
      }

      // Créer un client Supabase avec le token d'authentification de l'utilisateur
      const { data, error } = await supabase
        .storage
        .from('documents')
        .upload(filePath, fileBuffer, {
          contentType: getMimeType(fileExt),
          upsert: false
        });

      if (error) throw error;

      return {
        path: filePath,
        name: fileName
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload à Supabase:', error);
      throw error;
    }
  };

  // Fonction pour lancer la génération
  const handleLaunch = async () => {
    if (!selectedFormat || !importedFile) return;
    
    setIsGenerating(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', importedFile.file);
      formData.append('userId', user.id);
      formData.append('numberOfCards', cardCount);

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Obtenir le token d'authentification de l'utilisateur
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Impossible de récupérer le token d\'authentification');
      }

      // Appeler l'API appropriée en fonction du format sélectionné
      const endpoint = selectedFormat === 'memo' ? '/api/api_memocards' : '/api/api_qcm';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du traitement du fichier');
      }

      const data = await response.json();

      // Progression terminée
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Rediriger vers la page correspondante
      setTimeout(() => {
        if (selectedFormat === 'memo') {
          router.push(`/my-cards/${data.flashcardList.id}`);
        } else {
          router.push(`/results/qcm/${data.quizId}`);
        }
      }, 1000);

    } catch (error) {
      console.error('Erreur:', error);
      setIsGenerating(false);
      setIsUploading(false);
      setUploadProgress(0);
      alert('Une erreur est survenue lors du traitement du fichier: ' + error.message);
    }
  };

  // Gestion du drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;

    // Vérifier le type de fichier (PDF ou image)
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      alert('Seuls les fichiers PDF et images sont acceptés');
      return;
    }

    // Limiter la taille du fichier (par exemple, 10 Mo)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 10 Mo)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Convertir le fichier en ArrayBuffer pour l'upload
      const fileBuffer = await file.arrayBuffer();
      
      // Uploader le fichier à Supabase Storage
      const uploadedFile = await uploadToSupabaseStorage(fileBuffer, file.name, user.id);
      
      setUploadProgress(60);
      
      // Déterminer le type de fichier pour la base de données
      const fileType = file.type.startsWith('image/') ? file.type.split('/')[1] : 'pdf';
      
      // Créer une entrée dans la table documents
      const { data: newDocument, error: documentError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user.id,
            title: file.name,
            file_path: uploadedFile.path,
            file_size: file.size,
            file_type: fileType
          }
        ])
        .select()
        .single();
      
      clearInterval(progressInterval);
      
      if (documentError) {
        throw documentError;
      }
      
      setUploadProgress(100);
    
      // Rediriger vers la page de sélection de format avec l'ID du document
      setTimeout(() => {
        router.push(`/format-selection?courseId=${newDocument.id}`);
      }, 500);
      
    } catch (error) {
      console.error("Erreur lors de l'upload du fichier:", error);
      alert("Une erreur est survenue lors de l'upload du fichier. Veuillez réessayer.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Retour à l'étape d'upload
  const handleBack = () => {
    setStep('upload');
    setImportedFile(null);
  };
  
  // Interface mobile optimisée avec des éléments de la desktop view
  const MobileView = () => (
    <div className="h-[calc(100vh-16px)] mx-2 my-2 overflow-hidden flex flex-col">
      {/* Header simplifié */}
      <div className="flex justify-between items-center px-3 py-2 bg-[#ebebd7] rounded-2xl shadow-md border border-[#68ccff]/30 mb-3">
        <div className="flex items-center">
          {step === 'configure' ? (
            <button 
              onClick={handleBack}
              className="mr-2 p-1.5 text-[#25a1e1] bg-[#68ccff]/10 rounded-lg hover:bg-[#68ccff]/20"
            >
              <FaArrowLeft className="w-3 h-3" />
            </button>
          ) : null}
          <img src="/fayotlogo.png" alt="Logo Fayot" className="h-8" />
        </div>
        <button 
          onClick={toggleMenu} 
          className="p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-xl hover:bg-[#68ccff]/20 transition-colors duration-300"
        >
          <CiMenuBurger className="w-5 h-5" />
        </button>
      </div>

      {/* Étape d'upload de fichier */}
      {step === 'upload' && (
        <div className="bg-gradient-to-br from-[#68ccff]/10 via-[#ebebd7] to-[#68ccff]/20 rounded-2xl shadow-md border border-[#68ccff]/30 p-3 relative flex-grow flex flex-col overflow-hidden">
          {/* Éléments décoratifs minimalistes */}
          <div className="absolute -top-6 -left-6 w-20 h-20 bg-yellow-200 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#68ccff]/60 rounded-full opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
          
          <div className="h-full flex flex-col relative z-10">
            {/* Deux bulles d'explication */}
            <div className="space-y-2 mb-3">
              <div className="bg-[#ebebd7] p-3 rounded-xl shadow-sm border border-[#68ccff]/30 relative">
                <div className="absolute -left-2 -top-2 w-6 h-6 bg-[#25a1e1] rounded-full flex items-center justify-center text-[#ebebd7] font-bold shadow-sm border border-[#ebebd7]">
                  1
                </div>
                <h2 className="text-base font-medium text-[#106996] ml-3">
                  Transforme ton cours en <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">mémo cartes</span>
                </h2>
              </div>
              
              <div className="bg-[#ebebd7] p-3 rounded-xl shadow-sm border border-[#68ccff]/30 relative">
                <div className="absolute -left-2 -top-2 w-6 h-6 bg-[#25a1e1] rounded-full flex items-center justify-center text-[#ebebd7] font-bold shadow-sm border border-[#ebebd7]">
                  2
                </div>
                <h2 className="text-base font-medium text-[#106996] ml-3">
                  Révise à l'aide de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">QCM sur-mesure</span>
                </h2>
              </div>
            </div>

            {/* Zone d'import simplifiée */}
            <div className="flex-grow flex flex-col">
              <div className="bg-[#ebebd7] rounded-xl border border-[#68ccff]/30 shadow-sm p-3 h-full flex flex-col">
                <div className="mb-3 text-center">
                  <h3 className="text-lg font-bold text-gray-800 bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">
                    Importe ton cours
                  </h3>
                  <div className="inline-block mt-1 bg-[#68ccff]/10 px-2 py-1 rounded-lg text-[#106996] text-xs font-medium">
                    <FaLightbulb className="inline text-yellow-500 w-3 h-3 mr-1" />
                    Rapide & facile
                  </div>
                </div>
                
                <div className="flex-grow flex flex-col justify-center items-center">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center mb-2 space-x-4">
                      <div className="flex items-center">
                        <FaCloudUploadAlt className="text-[#25a1e1] w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">ou</span>
                      </div>
                      <div className="flex items-center">
                        <FaCamera className="text-[#25a1e1] w-5 h-5 mr-1" />
                      </div>
                    </div>
                    <p className="text-sm text-[#106996] mb-4">
                      Glisse ou sélectionne ton cours
                    </p>
                  </div>
                  
                  <div 
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all duration-300 ${
                      dragActive ? 'border-[#25a1e1] bg-[#68ccff]/10' : 'border-[#68ccff]/30 bg-[#ebebd7]/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileInput}
                      accept=".pdf,image/*"
                    />
                    
                    <>
                      <div className="flex items-center justify-center mb-4 space-x-4">
                        <div className="flex items-center">
                          <FaCloudUploadAlt className="text-[#25a1e1] w-6 h-6 mr-2" />
                          <span className="text-sm font-medium">ou</span>
                        </div>
                        <div className="flex items-center">
                          <FaCamera className="text-[#25a1e1] w-6 h-6" />
                        </div>
                      </div>
                      <p className="text-sm text-[#106996] mb-4">
                        Glisse ou sélectionne ton cours
                      </p>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#106996] text-[#ebebd7] font-bold py-3 px-6 rounded-xl hover:bg-[#0d5475] hover:scale-105 transition-all duration-300 shadow-md border border-[#106996]/70 hover:shadow-lg"
                      >
                        Sélectionner un fichier
                      </button>
                    </>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloc d'abonnement mobile */}
            <div className="mt-2">
              <SubscriptionBlock remainingCards={2} />
            </div>
          </div>
        </div>
      )}

      {/* Étape de configuration */}
      {step === 'configure' && (
        <div className="h-screen flex flex-col overflow-hidden">
          {/* Document importé */}
          <div className="bg-[#ebebd7] rounded-xl shadow-sm border border-[#68ccff]/30 p-2 mb-2 flex items-center">
            <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-semibold flex-shrink-0">
              {importedFile?.type.toUpperCase()}
            </div>
            <div className="ml-2 flex-grow overflow-hidden">
              <p className="font-semibold text-gray-800 text-sm truncate">{importedFile?.name}</p>
              <p className="text-xs text-gray-500 font-light truncate">{importedFile?.size} • {importedFile?.date}</p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
              <FaCheck className="w-2.5 h-2.5 mr-0.5" /> Prêt
            </span>
          </div>

          {/* Contenu principal scrollable */}
          <div className="overflow-auto flex-grow mb-2 space-y-2">
            {/* Explication compacte */}
            <div className="bg-[#68ccff]/10 p-2 rounded-xl border border-[#68ccff]/30 flex items-center">
              <p className="text-xs text-[#106996] font-medium">
                Le Fayot va créer {selectedFormat === 'memo' ? 
                  'tes mémo cartes' : 
                  'ton QCM'} <span className="text-semibold">personnalisé{selectedFormat === 'memo' ? 'es' : ''}</span>
              </p>
            </div>
            
            {/* Choix du format */}
            <div className="bg-[#ebebd7] p-2 rounded-xl border border-[#68ccff]/30 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Format d'étude</h3>
              
              <div className="space-y-2">
                {/* Mémocards */}
                <div 
                  className={`border ${selectedFormat === 'memo' ? 'border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30' : 'border-gray-200'} rounded-lg p-2 flex items-center shadow-sm cursor-pointer`}
                  onClick={() => handleFormatSelect('memo')}
                >
                  <div className={`w-8 h-8 ${selectedFormat === 'memo' ? 'bg-[#68ccff]/20' : 'bg-gray-100'} rounded-full flex items-center justify-center mr-2`}>
                    <BsCardHeading className={`w-4 h-4 ${selectedFormat === 'memo' ? 'text-[#25a1e1]' : 'text-gray-600'}`} />
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
                
                {/* QCM */}
                <div 
                  className={`border ${selectedFormat === 'qcm' ? 'border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30' : 'border-gray-200'} rounded-lg p-2 flex items-center cursor-pointer`}
                  onClick={() => handleFormatSelect('qcm')}
                >
                  <div className={`w-8 h-8 ${selectedFormat === 'qcm' ? 'bg-[#68ccff]/20' : 'bg-gray-100'} rounded-full flex items-center justify-center mr-2`}>
                    <BsQuestionCircleFill className={`w-4 h-4 ${selectedFormat === 'qcm' ? 'text-[#25a1e1]' : 'text-gray-600'}`} />
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
                <span className="font-bold">
                  Générer {cardCount} {selectedFormat === 'memo' ? 'mémo cartes' : 'questions de QCM'}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Afficher la progression d'upload si nécessaire */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-[#ebebd7] p-5 rounded-xl max-w-xs w-full">
            <div className="w-full bg-[#68ccff]/30 rounded-full h-2 mb-3">
              <div 
                className="bg-[#25a1e1] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-center text-[#106996] font-medium">
              {uploadProgress === 100 ? 'Analyse terminée !' : `Analyse en cours... ${uploadProgress}%`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
  
  // Interface desktop réorganisée, sections empilées
  const DesktopView = () => (
    <div className="flex flex-col w-full">
      {/* Première section - Import de fichiers ou Configuration */}
      <section className="min-h-screen py-6 px-6">
        <div className="h-full bg-gradient-to-br from-[#68ccff]/10 via-[#ebebd7] to-[#68ccff]/20 rounded-2xl shadow-lg border-2 border-[#68ccff]/30 p-6 relative overflow-hidden">
          {/* Éléments décoratifs */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-200 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute top-1/3 -right-16 w-32 h-32 bg-pink-200 rounded-full opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
          
          {/* Header avec titre */}
          <div className="relative z-10 mb-8 flex justify-between">
            <div className="flex items-center">
              {step === 'configure' && (
                <button 
                  onClick={handleBack}
                  className="mr-4 p-2 text-[#25a1e1] bg-[#68ccff]/10 rounded-lg hover:bg-[#68ccff]/20 transition-all duration-300 flex items-center"
                >
                  <FaArrowLeft className="w-3 h-3 mr-1" />
                  <span className="text-sm font-medium">Retour</span>
                </button>
              )}
              <div className="flex items-center">
                <img src="/fayotlogo.png" alt="Logo Fayot" className="h-20 mr-4" />
                <p className="text-[#106996] font-medium text-light italic">C'est le premier de la classe <br></br> qui t'aide à réviser</p>
              </div>
            </div>
          </div>

          {/* Étape d'upload de fichier */}
          {step === 'upload' && (
            <div className="w-full flex relative z-10 h-[calc(100%-8rem)]">
              {/* Partie gauche - Colonnes divisées verticalement (60%) */}
              <div className="w-3/5 pr-6 flex flex-col justify-between">
                {/* Bulles d'explication (haut) - Simplifiées et améliorées */}
                <div className="flex space-x-6 mb-6">
                  <div className="w-1/2 bg-[#ebebd7] p-5 rounded-2xl border-2 border-[#68ccff]/30 shadow-md relative flex items-center justify-center">
                    <div className="absolute -left-4 -top-4 w-10 h-10 bg-[#25a1e1] rounded-full flex items-center justify-center text-[#ebebd7] font-bold text-xl shadow-md border-2 border-[#ebebd7]">
                      1
                    </div>
                    <h2 className="text-xl font-medium text-[#106996] text-center px-2">
                      Transforme ton cours en <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">mémo cartes</span>
                    </h2>
                  </div>
                  
                  <div className="w-1/2 bg-[#ebebd7] p-5 rounded-2xl border-2 border-[#68ccff]/30 shadow-md relative flex items-center justify-center">
                    <div className="absolute -left-4 -top-4 w-10 h-10 bg-[#25a1e1] rounded-full flex items-center justify-center text-[#ebebd7] font-bold text-xl shadow-md border-2 border-[#ebebd7]">
                      2
                    </div>
                    <h2 className="text-xl font-medium text-[#106996] text-center px-2">
                      Révise à l'aide de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#25a1e1] to-[#106996]">QCM sur-mesure</span>
                    </h2>
                  </div>
                </div>
                
                {/* Section d'import (bas) - Version réorganisée */}
                <div className="bg-[#ebebd7] p-5 rounded-2xl border-2 border-[#68ccff]/30 shadow-md relative flex flex-col overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-[#25a1e1] to-[#106996] text-[#ebebd7] py-1 px-3 rounded-bl-xl rounded-tr-xl text-sm font-bold">
                    Facile et rapide !
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-[#106996] mb-5 text-center mt-2">
                    Importe ton cours
                  </h3>
                  
                  <div className="flex items-center justify-center mb-5">
                    <div className="flex items-center justify-center p-3 bg-[#68ccff]/10 rounded-xl border border-[#68ccff]/30">
                      <div className="flex flex-col items-center mx-3">
                        <div className="w-12 h-12 bg-[#68ccff]/20 rounded-full flex items-center justify-center mb-2 shadow-sm">
                          <FaCloudUploadAlt className="text-[#25a1e1] w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-[#106996]">Upload</span>
                      </div>
                      <span className="text-md font-medium text-[#106996] mx-3">ou</span>
                      <div className="flex flex-col items-center mx-3">
                        <div className="w-12 h-12 bg-[#68ccff]/20 rounded-full flex items-center justify-center mb-2 shadow-sm">
                          <FaCamera className="text-[#25a1e1] w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-[#106996]">Photo</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-center text-[#106996] text-lg mb-5 font-medium">
                    Glisse ou sélectionne ton cours
                  </p>
                  
                  <div 
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all duration-300 ${
                      dragActive ? 'border-[#25a1e1] bg-[#68ccff]/10' : 'border-[#68ccff]/30 bg-[#ebebd7]/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileInput}
                      accept=".pdf,image/*"
                    />
                    
                    <div className="text-center">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#106996] text-[#ebebd7] font-bold py-3 px-8 rounded-xl hover:bg-[#0d5475] hover:scale-105 transition-all duration-300 shadow-lg border border-[#106996]/70 hover:shadow-xl text-xl mb-2"
                      >
                        Sélectionner un fichier
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partie droite - Abonnement (40%) */}
              <div className="w-2/5 pl-6 flex flex-col justify-center">
                <div className="bg-[#ebebd7] p-6 rounded-2xl border-2 border-[#68ccff]/30 shadow-md h-full flex items-center justify-center">
                  <div className="w-full h-full flex flex-col justify-center">
                    {/* Version agrandie du SubscriptionBlock avec styles personnalisés */}
                    <div className="rounded-xl bg-gradient-to-r from-[#106996] to-[#25a1e1] p-5 text-[#ebebd7] shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <FaCrown className="w-6 h-6 text-yellow-400 mr-2" />
                          <span className="font-semibold text-lg">Abonnement</span>
                        </div>
                        <div className="bg-[#ebebd7]/20 px-2 py-1 rounded-lg">
                          <span className="font-bold text-yellow-300 text-lg">2/2</span>
                        </div>
                      </div>
                      
                      <p className="text-base mb-4">
                        Vous êtes limité à <span className="font-bold">2 mémo cartes</span>. Passez à l'abonnement pour une création illimitée !
                      </p>
                      
                      <div className="text-center text-2xl font-bold mb-3">9,99€<span className="text-base font-normal ml-1">/mois</span> <span className="text-base line-through opacity-75 ml-1">14,99€</span></div>
                      
                      <div className="bg-[#ebebd7]/10 rounded-lg p-3 mb-4">
                        <ul className="space-y-2">
                          <li className="flex items-center">
                            <div className="mr-2 text-green-300">✓</div>
                            <span>Mémo cartes illimitées</span>
                          </li>
                          <li className="flex items-center">
                            <div className="mr-2 text-green-300">✓</div>
                            <span>QCM personnalisés</span>
                          </li>
                          <li className="flex items-center">
                            <div className="mr-2 text-green-300">✓</div>
                            <span>Synchronisation multi-appareils</span>
                          </li>
                        </ul>
                      </div>
                      
                      <button className="w-full bg-[#ebebd7] text-[#106996] rounded-lg py-3 font-bold text-lg hover:bg-[#ebebd7]/90 transition-colors hover:scale-105 transform duration-300 shadow-md">
                        Débloquer l'illimité
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape de configuration */}
          {step === 'configure' && (
            <div className="w-full relative z-10 h-[calc(100%-8rem)]">
              {/* Document importé - compact */}
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
                    className={`border ${selectedFormat === 'memo' ? 'border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30' : 'border-gray-200'} rounded-xl p-4 shadow-sm flex items-center cursor-pointer mb-3`}
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
                  
                  <div 
                    className={`border ${selectedFormat === 'qcm' ? 'border-2 border-[#25a1e1] ring-2 ring-[#68ccff]/30' : 'border-gray-200'} rounded-xl p-4 shadow-sm flex items-center cursor-pointer`}
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
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    {selectedFormat === 'memo' ? 'Nombre de mémo cartes' : 'Nombre de questions'}
                  </h2>
                  
                  <div className="mb-6">
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-500 font-medium">Peu {selectedFormat === 'memo' ? 'de cartes' : 'de questions'}</span>
                        <span className="text-lg font-bold text-[#25a1e1]">{cardCount}</span>
                        <span className="text-sm text-gray-500 font-medium">Beaucoup {selectedFormat === 'memo' ? 'de cartes' : 'de questions'}</span>
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
                        <span className="font-bold">
                          Générer {cardCount} {selectedFormat === 'memo' ? 'mémo cartes' : 'questions de QCM'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Afficher la progression d'upload si nécessaire */}
          {isUploading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
              <div className="bg-[#ebebd7] p-6 rounded-xl max-w-md w-full">
                <div className="w-full bg-[#68ccff]/30 rounded-full h-3 mb-4">
                  <div 
                    className="bg-[#25a1e1] h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-center text-[#106996] font-medium">
                  {uploadProgress === 100 ? 'Analyse terminée !' : `Analyse en cours... ${uploadProgress}%`}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
  
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
}