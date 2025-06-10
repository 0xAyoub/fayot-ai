import { Mistral } from '@mistralai/mistralai';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

// Configuration Mistral AI
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY || supabaseKey);

// Configuration multer pour le stockage temporaire en mémoire (pas sur disque)
const upload = multer({
  storage: multer.memoryStorage()
});

// Fonction pour uploader un fichier à Supabase Storage
async function uploadToSupabaseStorage(fileBuffer, fileName, userId, authToken) {
  const fileExt = path.extname(fileName);
  const uniqueFileName = `${Date.now()}-${uuidv4()}${fileExt}`;
  const filePath = `${userId}/${uniqueFileName}`;

  try {
    // Créer un client Supabase avec le token d'authentification de l'utilisateur
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
    }
      }
});

    // Utiliser le client authentifié pour l'upload
    const { data, error } = await supabaseUser
      .storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: getMimeType(fileExt),
        upsert: false
      });

    if (error) throw error;

    // Obtenir l'URL publique du fichier
    const { data: urlData, error: urlError } = await supabaseUser
      .storage
      .from('documents')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // URL valide 7 jours

    if (urlError) throw urlError;

    return {
      path: filePath,
      url: urlData.signedUrl,
      name: fileName
    };
  } catch (error) {
    console.error('Erreur lors de l\'upload à Supabase:', error);
    throw error;
  }
}

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

// Fonction pour obtenir le contenu d'un fichier depuis Supabase Storage
async function getFileFromSupabaseStorage(filePath, authToken) {
  try {
    // Créer un client Supabase avec le token d'authentification de l'utilisateur
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    });
    
    const { data, error } = await supabaseUser
      .storage
      .from('documents')
      .download(filePath);

    if (error) throw error;
    
    return data; // Retourne le buffer du fichier
  } catch (error) {
    console.error('Erreur lors de la récupération du fichier depuis Supabase:', error);
    
    // Vérifier si nous sommes en environnement de développement local
    if (process.env.NODE_ENV === 'development') {
      console.log('Environnement de développement détecté. Utilisation d\'un fichier de test par défaut.');
      // Renvoyer un buffer de fichier vide ou un exemple
      // Pour le développement local, on crée un buffer d'un fichier texte simple
      return Buffer.from('Contenu de test pour le développement local. Ce document est utilisé quand le vrai fichier est inaccessible.');
    }
    
    throw error;
  }
}

// Fonction pour déboguer la structure d'un objet de manière sécurisée
function debugObjectStructure(obj, maxDepth = 3) {
  // Fonction récursive pour explorer les propriétés avec limitation de profondeur
  function explore(obj, depth = 0) {
    if (depth > maxDepth) return "[max depth reached]";
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";
  
    const type = typeof obj;
    
    // Types primitifs
    if (type !== "object") return `[${type}] ${String(obj).substring(0, 100)}${String(obj).length > 100 ? '...' : ''}`;
    
    // Pour éviter les erreurs de circularité
    try {
      // Arrays
      if (Array.isArray(obj)) {
        if (obj.length === 0) return "[]";
        if (depth === maxDepth) return `[Array(${obj.length})]`;
        
        return `[Array(${obj.length})] [${obj.slice(0, 3).map(item => explore(item, depth + 1)).join(', ')}${obj.length > 3 ? ', ...' : ''}]`;
      }
      
      // Objets
      const keys = Object.keys(obj);
      if (keys.length === 0) return "{}";
      if (depth === maxDepth) return `{Object with ${keys.length} keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? ', ...' : ''}}`;
      
      const entries = keys.slice(0, 10).map(key => {
        try {
          return `"${key}": ${explore(obj[key], depth + 1)}`;
        } catch (e) {
          return `"${key}": [Error: ${e.message}]`;
        }
      });
      
      return `{${entries.join(', ')}${keys.length > 10 ? ', ...' : ''}}`;
    } catch (e) {
      return `[Error: ${e.message}]`;
            }
          }
  
  try {
    return explore(obj);
  } catch (e) {
    return `Failed to debug object: ${e.message}`;
  }
}

// Fonction pour extraire le JSON d'une chaîne potentiellement formatée en Markdown
function extractJSONFromMarkdown(text) {
  // Si le texte commence par des backticks (format markdown), on les retire
  let cleanedText = text.trim();
  
  // Cas 1: JSON encapsulé dans des balises de code markdown (```json ... ```)
  const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = cleanedText.match(jsonCodeBlockRegex);
  if (match && match[1]) {
    cleanedText = match[1].trim();
  }
  
  // Cas 2: Le texte contient un tableau ou un objet JSON mais avec du texte avant ou après
  // On essaie de trouver le début d'un objet/tableau JSON et sa fin
  if (!match) {
    const objectStartIndex = cleanedText.indexOf('{');
    const arrayStartIndex = cleanedText.indexOf('[');
    let startIndex = -1;
    
    if (objectStartIndex >= 0 && arrayStartIndex >= 0) {
      // Prendre celui qui apparaît en premier
      startIndex = Math.min(objectStartIndex, arrayStartIndex);
    } else if (objectStartIndex >= 0) {
      startIndex = objectStartIndex;
    } else if (arrayStartIndex >= 0) {
      startIndex = arrayStartIndex;
    }
    
    if (startIndex >= 0) {
      cleanedText = cleanedText.substring(startIndex);
      
      // Trouver la fin correspondante (comptage des accolades/crochets)
      let isArray = cleanedText.startsWith('[');
      let openBrackets = 0;
      let endIndex = -1;
      
      for (let i = 0; i < cleanedText.length; i++) {
        const char = cleanedText[i];
        if ((isArray && char === '[') || (!isArray && char === '{')) {
          openBrackets++;
        } else if ((isArray && char === ']') || (!isArray && char === '}')) {
          openBrackets--;
          if (openBrackets === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      if (endIndex > 0) {
        cleanedText = cleanedText.substring(0, endIndex);
      }
    }
  }
  
  return cleanedText;
}

// Fonction pour générer des QCM avec Mistral Document QnA
async function generateQCMFromDocument(fileBuffer, fileName, numberOfQuestions, difficultParts = '') {
  try {
    console.log(`Génération de QCM à partir du document: ${fileName}`);
    
    // Télécharger le fichier sur Mistral Files API directement depuis le buffer
    console.log("Téléchargement du fichier sur Mistral Files API...");
    
    // Télécharger le fichier via l'API de fichiers Mistral
    const uploadedFile = await mistral.files.upload({
      file: {
        fileName: fileName,
        content: fileBuffer,
      },
      purpose: "ocr"
    });
    
    console.log("Fichier téléchargé avec succès, ID:", uploadedFile.id);
    
    // Obtenir l'URL signée pour le fichier
    const signedUrl = await mistral.files.getSignedUrl({
      fileId: uploadedFile.id,
    });
    
    console.log("URL signée obtenue avec succès");
    
    // Construire le prompt pour la génération de QCM
    const difficultyText = difficultParts 
      ? `en insistant particulièrement sur ces concepts: ${difficultParts}` 
      : '';
    
    const userPrompt = `Analyse ce document et génère ${numberOfQuestions} questions à choix multiples (QCM) de haute qualité ${difficultyText}. 

CONSIGNES IMPORTANTES:
1. Chaque question doit avoir exactement 4 options
2. Le nombre de réponses correctes doit varier (environ 60% avec 1 bonne réponse, 30% avec 2 bonnes réponses, 10% avec 3 bonnes réponses)
3. Tu ne dois JAMAIS générer de question avec 0 ou 4 réponses correctes
4. Assure-toi que les options incorrectes sont plausibles mais clairement fausses
5. Chaque question doit avoir une explication qui justifie les réponses correctes

RENVOIE UNIQUEMENT UN TABLEAU JSON SUIVANT EXACTEMENT CE FORMAT:
[
  {
    "question": "Question sur le document",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptions": [0, 2], // Indices des options correctes (0 = Option A, 1 = Option B, etc.)
    "explanation": "Explication détaillée des réponses correctes"
  }
]

Ne mets pas de texte ou d'explications avant ou après le JSON. Renvoie uniquement le tableau JSON pur.`;

    // Appeler l'API Mistral Document QnA avec l'URL signée
    console.log("Envoi de la requête à Mistral Document QnA...");
    const response = await mistral.chat.complete({
      model: "mistral-large-2411",
      messages: [
      {
        role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "document_url",
              documentUrl: signedUrl.url // Utiliser l'URL signée au lieu du base64
            }
          ]
        }
      ],
      temperature: 0.3,
      response_format: { type: "json" },
    max_tokens: 3000
  });

    // Extraire la réponse
    const responseContent = response.choices[0].message.content;
    console.log("Réponse reçue de Mistral Document QnA, longueur:", responseContent.length);
    
    // Nettoyer et valider le JSON
  try {
      // Tentative de parser le JSON directement
      const parsedQuestions = JSON.parse(responseContent);
      
      // Validation du format des questions
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Le résultat n'est pas un tableau JSON");
      }
      
      console.log(`Parsing JSON réussi, ${parsedQuestions.length} questions trouvées`);
      
      // Vérifier et corriger chaque question si nécessaire
      const validatedQuestions = parsedQuestions.map((question, index) => {
        const validatedQuestion = {
          question: question.question || `Question ${index + 1} sur le document`,
          options: Array.isArray(question.options) && question.options.length === 4 
            ? question.options 
            : ["Option A", "Option B", "Option C", "Option D"],
          correctOptions: Array.isArray(question.correctOptions) ? question.correctOptions : [0],
          explanation: question.explanation || "Explication non fournie."
        };
        
        // S'assurer que correctOptions contient des indices valides
        validatedQuestion.correctOptions = validatedQuestion.correctOptions.filter(
          index => Number.isInteger(index) && index >= 0 && index < validatedQuestion.options.length
        );
        
        // S'assurer qu'il y a au moins une option correcte
        if (validatedQuestion.correctOptions.length === 0) {
          validatedQuestion.correctOptions = [0];
        }
        
        return validatedQuestion;
      });
      
      console.log(`${validatedQuestions.length} questions validées avec succès`);
      return validatedQuestions;
    } catch (parseError) {
      console.error("Erreur lors du parsing JSON:", parseError);
      
      // Essayer d'extraire le JSON du texte formaté
      try {
        const extractedJSON = extractJSONFromMarkdown(responseContent);
        const parsedExtractedQuestions = JSON.parse(extractedJSON);
        
        if (!Array.isArray(parsedExtractedQuestions)) {
          throw new Error("Le résultat extrait n'est pas un tableau JSON");
        }
        
        // Vérifier et corriger chaque question
        const validatedQuestions = parsedExtractedQuestions.map((question, index) => {
          return {
            question: question.question || `Question ${index + 1} sur le document`,
            options: Array.isArray(question.options) && question.options.length === 4 
              ? question.options 
              : ["Option A", "Option B", "Option C", "Option D"],
            correctOptions: Array.isArray(question.correctOptions) ? question.correctOptions : [0],
            explanation: question.explanation || "Explication non fournie."
          };
        });
        
        console.log(`${validatedQuestions.length} questions extraites et validées avec succès`);
        return validatedQuestions;
      } catch (extractError) {
        console.error("Impossible d'extraire des questions valides:", extractError);
        return createFallbackQuestions(numberOfQuestions);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la génération des QCM avec Document QnA:", error);
    console.error("Message d'erreur complet:", error.message);
    return createFallbackQuestions(numberOfQuestions);
  }
}

// Fonction pour créer une question de secours générique
function createGenericQuestion(questionNumber) {
  return {
    question: `Question ${questionNumber} sur le document analysé`,
    options: [
      "Le document contient cette information",
      "Le document ne contient pas cette information",
      "L'information est partiellement présente dans le document",
      "Impossible de déterminer avec les informations disponibles"
    ],
    correctOptions: [3],
    explanation: "En raison de limitations dans l'analyse du document, nous ne pouvons pas fournir une question spécifique au contenu."
  };
}

// Fonction pour créer un ensemble de questions de secours
function createFallbackQuestions(numberOfQuestions) {
  const fallbackQuestions = [];
  
  fallbackQuestions.push({
    question: "Problème lors de la génération des questions basées sur le document",
    options: [
      "Réessayer avec le même document",
      "Essayer avec un document mieux formaté",
      "Contacter le support technique",
      "Essayer avec un document plus court"
    ],
    correctOptions: [1, 3],
    explanation: "La génération de QCM nécessite un document exploitable par l'IA."
  });
  
  // Ajouter des questions supplémentaires si nécessaire
  while (fallbackQuestions.length < numberOfQuestions) {
    fallbackQuestions.push(createGenericQuestion(fallbackQuestions.length + 1));
  }
  
  console.log(`${fallbackQuestions.length} questions de secours générées`);
  return fallbackQuestions;
}

// Route API principale
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Extraire le token d'authentification
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé: Token d\'authentification manquant ou invalide' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Créer un client Supabase avec le token
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Vérifier l'utilisateur
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData || !userData.user) {
      return res.status(401).json({ error: 'Non autorisé: Utilisateur non authentifié' });
    }
    
    let document;
    let questions = [];
    let userId;
    let numberOfQuestions;
    let difficultParts = '';
    let fileBuffer;
    let fileName;

    // Déterminer si nous avons un document existant ou un nouveau fichier
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      // Traitement d'un document existant
      // Puisque bodyParser est désactivé, nous devons analyser manuellement le JSON
      const rawBody = await new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.on('end', () => {
          resolve(data);
        });
      });
      
      const body = JSON.parse(rawBody);
      userId = body.userId;
      numberOfQuestions = parseInt(body.numberOfCards) || 10;
      difficultParts = body.difficultParts || '';
      const documentId = body.documentId;

      if (!documentId || !userId) {
        return res.status(400).json({ error: 'ID du document ou ID utilisateur manquant' });
      }

      // Vérifier que l'ID utilisateur correspond à l'utilisateur authentifié
      if (userId !== userData.user.id) {
        return res.status(403).json({ error: 'Non autorisé: l\'ID utilisateur ne correspond pas à l\'utilisateur authentifié' });
      }

      // Récupérer le document depuis Supabase
      const { data: existingDocument, error: documentError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (documentError) {
        throw documentError;
      }

      document = existingDocument;
      
      // Récupérer le fichier depuis Supabase Storage
      try {
        fileBuffer = await getFileFromSupabaseStorage(document.file_path, token);
      } catch (error) {
        console.error('Impossible de récupérer le fichier. Utilisation d\'un fichier de secours:', error);
        // En cas d'erreur, créer un buffer par défaut pour pouvoir continuer
        if (process.env.NODE_ENV === 'development') {
          fileBuffer = Buffer.from('Contenu de test pour le développement local. Ce document est utilisé quand le vrai fichier est inaccessible.');
        } else {
          throw error; // En production, on propage l'erreur
        }
      }
      fileName = path.basename(document.file_path);

      // Générer les QCM directement à partir du document avec Document QnA
      questions = await generateQCMFromDocument(fileBuffer, fileName, numberOfQuestions, difficultParts);
    } else {
      // Traitement d'un nouveau fichier
    // Middleware multer pour gérer le téléchargement de fichier
    await new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    const { file } = req;
      userId = req.body.userId;
      numberOfQuestions = parseInt(req.body.numberOfCards) || 10;
      difficultParts = req.body.difficultParts || '';

    if (!file || !userId) {
        return res.status(400).json({ error: 'Fichier ou ID utilisateur manquant' });
    }
    
    // Vérifier que l'ID utilisateur correspond à l'utilisateur authentifié
    if (userId !== userData.user.id) {
      return res.status(403).json({ error: 'Non autorisé: l\'ID utilisateur ne correspond pas à l\'utilisateur authentifié' });
    }

      // Uploader le fichier à Supabase Storage
      const uploadedFile = await uploadToSupabaseStorage(file.buffer, file.originalname, userId, token);
    
    // Stocker le document dans Supabase
      const { data: newDocument, error: documentError } = await supabase
      .from('documents')
      .insert([
        {
          user_id: userId,
          title: file.originalname,
            file_path: uploadedFile.path,
          file_size: file.size,
          file_type: file.mimetype.split('/')[1]
        }
      ])
      .select()
      .single();

    if (documentError) {
      throw documentError;
    }
    
      document = newDocument;
      
      // Utiliser directement le buffer du fichier pour la génération
      fileBuffer = file.buffer;
      fileName = file.originalname;
      
      // Générer les QCM directement à partir du document avec Document QnA
      questions = await generateQCMFromDocument(fileBuffer, fileName, numberOfQuestions, difficultParts);
    }

    // Créer un nouveau quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([
        {
          user_id: userId,
          title: `Quiz - ${document.title}`,
          description: `Quiz généré à partir de ${document.title}`
        }
      ])
      .select()
      .single();

    if (quizError) {
      throw quizError;
    }

    // Stocker chaque question dans Supabase
    const questionsPromises = questions.map(question => 
      supabase
        .from('quiz_questions')
        .insert([
          {
            quiz_id: quiz.id,
            question: question.question,
            options: JSON.stringify(question.options),
            correct_options: JSON.stringify(question.correctOptions),
            explanation: question.explanation || ""
          }
        ])
    );
    
    await Promise.all(questionsPromises);

    return res.status(200).json({
      success: true,
      document: document,
      quizId: quiz.id,
      questionsCount: questions.length
    });

  } catch (error) {
    console.error('Erreur de traitement:', error);
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false, // Désactiver le parsing automatique pour utiliser multer
  },
};
