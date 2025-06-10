import { Mistral } from '@mistralai/mistralai';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { put } from '@vercel/blob';

// Détection de l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';
const isVercelEnv = process.env.VERCEL || process.env.VERCEL_ENV;

// Configuration Mistral AI
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY || supabaseKey);

// Création du dossier uploads s'il n'existe pas (uniquement en développement local)
if (!isVercelEnv) {
  const uploadDir = './public/uploads/';
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (error) {
      console.warn("Impossible de créer le dossier uploads, stockage local désactivé:", error.message);
    }
  }
}

// Configuration multer pour le stockage des fichiers (uniquement en développement)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10 Mo
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les PDF et images
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé. Seuls les PDF et images sont acceptés.'), false);
    }
  }
});

// Fonction pour gérer le stockage de fichiers (production vs développement)
async function storeFile(file) {
  if (isVercelEnv) {
    // Utiliser Vercel Blob Storage en production
    console.log("Utilisation de Vercel Blob Storage pour stocker le fichier");
    const blobName = `uploads/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const blob = await put(blobName, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
    });
    return {
      path: blob.url,
      isBlob: true,
      blobUrl: blob.url
    };
  } else {
    // Utiliser le stockage local en développement
    console.log("Utilisation du stockage local pour stocker le fichier");
    return {
      path: file.path,
      isBlob: false
    };
  }
}

// Fonction pour lire un fichier (production vs développement)
async function readFile(filePath, isBlob) {
  if (isBlob) {
    // En production, télécharger le fichier depuis l'URL du blob
    console.log("Lecture du fichier depuis Vercel Blob Storage:", filePath);
    const response = await fetch(filePath);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } else {
    // En développement, lire le fichier local
    console.log("Lecture du fichier local:", filePath);
    return fs.readFileSync(filePath);
  }
}

// Fonction pour encoder un fichier en base64
function encodeFileToBase64(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error(`Erreur lors de l'encodage du fichier en base64:`, error);
    return null;
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

// Fonction pour générer des mémocartes avec Mistral Document QnA
async function generateMemocardsFromDocument(filePath, numberOfCards, difficultParts = '', isBlob = false) {
  try {
    console.log(`Génération de mémocartes à partir du document: ${filePath}`);
    
    // Vérifier que le fichier existe ou est accessible
    let fileBuffer;
    let fileName;
    
    if (isBlob) {
      // Pour les fichiers stockés dans Vercel Blob
      const response = await fetch(filePath);
      if (!response.ok) {
        console.error(`Impossible d'accéder au fichier: ${filePath}`);
        return createFallbackCards(numberOfCards);
      }
      fileBuffer = Buffer.from(await response.arrayBuffer());
      fileName = filePath.split('/').pop();
    } else {
      // Pour les fichiers locaux
      if (!fs.existsSync(filePath)) {
        console.error(`Le fichier n'existe pas: ${filePath}`);
        return createFallbackCards(numberOfCards);
      }
      fileBuffer = fs.readFileSync(filePath);
      fileName = path.basename(filePath);
    }

    // Télécharger le fichier sur Mistral Files API
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
    
    // Construire le prompt pour la génération de mémocartes
    const difficultyText = difficultParts 
      ? `en insistant particulièrement sur ces concepts: ${difficultParts}` 
      : '';
    
    const userPrompt = `Analyse ce document et génère ${numberOfCards} mémocartes (paires question-réponse) de haute qualité ${difficultyText}. 

CONSIGNES IMPORTANTES:
1. Chaque mémocarte doit comporter une question claire et une réponse détaillée
2. Les questions doivent tester la compréhension du contenu du document
3. Les réponses doivent être informatives, précises et basées sur le document
4. Varie les types de questions (définitions, explications, relations cause-effet, etc.)
5. Assure-toi que les mémocartes couvrent les points importants du document

RENVOIE UNIQUEMENT UN TABLEAU JSON SUIVANT EXACTEMENT CE FORMAT:
[
  {
    "question": "Question précise sur le document",
    "answer": "Réponse détaillée qui explique le concept"
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
      const parsedCards = JSON.parse(responseContent);
      
      // Validation du format des cartes
      if (!Array.isArray(parsedCards)) {
        throw new Error("Le résultat n'est pas un tableau JSON");
      }
      
      console.log(`Parsing JSON réussi, ${parsedCards.length} mémocartes trouvées`);
      
      // Vérifier et corriger chaque carte si nécessaire
      const validatedCards = parsedCards.map((card, index) => {
        return {
          question: card.question || `Question ${index + 1} sur le document`,
          answer: card.answer || "Pas de réponse fournie pour cette question."
        };
      });
      
      console.log(`${validatedCards.length} mémocartes validées avec succès`);
      return validatedCards;
    } catch (parseError) {
      console.error("Erreur lors du parsing JSON:", parseError);
      
      // Essayer d'extraire le JSON du texte formaté
      try {
        const extractedJSON = extractJSONFromMarkdown(responseContent);
        const parsedExtractedCards = JSON.parse(extractedJSON);
        
        if (!Array.isArray(parsedExtractedCards)) {
          throw new Error("Le résultat extrait n'est pas un tableau JSON");
        }
        
        // Vérifier et corriger chaque carte
        const validatedCards = parsedExtractedCards.map((card, index) => {
          return {
            question: card.question || `Question ${index + 1} sur le document`,
            answer: card.answer || "Pas de réponse fournie pour cette question."
          };
        });
        
        console.log(`${validatedCards.length} mémocartes extraites et validées avec succès`);
        return validatedCards;
      } catch (extractError) {
        console.error("Impossible d'extraire des mémocartes valides:", extractError);
        return createFallbackCards(numberOfCards);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la génération des mémocartes avec Document QnA:", error);
    console.error("Message d'erreur complet:", error.message);
    return createFallbackCards(numberOfCards);
  }
}

// Fonction pour créer une mémocarte de secours générique
function createGenericCard(cardNumber) {
  return {
    question: `Question ${cardNumber} sur le document analysé`,
    answer: "En raison de limitations dans l'analyse du document, nous ne pouvons pas fournir une mémocarte spécifique au contenu. Veuillez consulter le document original."
  };
}

// Fonction pour créer un ensemble de mémocartes de secours
function createFallbackCards(numberOfCards) {
  const fallbackCards = [];
  
  fallbackCards.push({
    question: "Problème lors de la génération des mémocartes basées sur le document",
    answer: "La génération de mémocartes nécessite un document exploitable par l'IA. Essayez avec un document mieux formaté ou contenant plus de texte."
  });
  
  // Ajouter des cartes supplémentaires si nécessaire
  while (fallbackCards.length < numberOfCards) {
    fallbackCards.push(createGenericCard(fallbackCards.length + 1));
  }
  
  console.log(`${fallbackCards.length} mémocartes de secours générées`);
  return fallbackCards;
}

// Middleware pour gérer les fichiers en production
const handleFileUpload = async (req, res) => {
  if (isVercelEnv) {
    // En production sur Vercel, utiliser la méthode de buffer pour le fichier
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Analyser le multipart form-data manuellement
    const boundary = req.headers['content-type'].split('boundary=')[1];
    
    // Recherche de l'entrée "file" dans le multipart form-data
    const parts = buffer.toString().split(`--${boundary}`);
    let file = null;
    let fileMetadata = {};
    
    // Extraire les informations du formulaire
    const formData = {};
    
    for (const part of parts) {
      const match = part.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?([\s\S]*)/);
      if (match) {
        const name = match[1];
        const filename = match[2];
        let content = match[3].trim();
        
        // Supprimer les entêtes supplémentaires si présents
        const contentStartIndex = content.indexOf('\r\n\r\n');
        if (contentStartIndex !== -1) {
          content = content.substring(contentStartIndex + 4);
        }
        
        if (name === 'file' && filename) {
          // Traitement du fichier
          fileMetadata = {
            originalname: filename,
            mimetype: part.match(/Content-Type: ([^\r\n]+)/)?.[1] || 'application/octet-stream',
            buffer: Buffer.from(content, 'binary')
          };
          file = fileMetadata;
        } else {
          // Autres champs du formulaire
          formData[name] = content;
        }
      }
    }
    
    // Attacher les données extraites à l'objet req
    req.file = file;
    req.body = formData;
    
    return { file, formData };
  } else {
    // En développement, utiliser multer comme avant
    return new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) reject(err);
        resolve({ file: req.file, formData: req.body });
      });
    });
  }
};

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
    let flashcards = [];
    let userId;
    let numberOfCards;
    let difficultParts = '';
    let isStoredInBlob = false;

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
      numberOfCards = parseInt(body.numberOfCards) || 10;
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
      isStoredInBlob = document.is_blob || document.file_path.includes('blob.vercel-storage.com');

      // Générer les mémocartes directement à partir du document avec Document QnA
      flashcards = await generateMemocardsFromDocument(document.file_path, numberOfCards, difficultParts, isStoredInBlob);
    } else {
      // Traitement d'un nouveau fichier
      // Utiliser le middleware approprié selon l'environnement
      const { file, formData } = await handleFileUpload(req, res);

      if (!file) {
        return res.status(400).json({ error: 'Fichier manquant' });
      }

      userId = formData.userId || req.body.userId;
      numberOfCards = parseInt(formData.numberOfCards || req.body.numberOfCards) || 10;
      difficultParts = formData.difficultParts || req.body.difficultParts || '';

      if (!userId) {
        return res.status(400).json({ error: 'ID utilisateur manquant' });
      }
      
      // Vérifier que l'ID utilisateur correspond à l'utilisateur authentifié
      if (userId !== userData.user.id) {
        return res.status(403).json({ error: 'Non autorisé: l\'ID utilisateur ne correspond pas à l\'utilisateur authentifié' });
      }

      // Stocker le fichier selon l'environnement
      const fileStorage = await storeFile(file);
      isStoredInBlob = fileStorage.isBlob;

      // Stocker le document dans Supabase
      const { data: newDocument, error: documentError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: userId,
            title: file.originalname,
            file_path: fileStorage.path,
            file_size: file.size || (file.buffer ? file.buffer.length : 0),
            file_type: file.mimetype.split('/')[1],
            is_blob: isStoredInBlob
          }
        ])
        .select()
        .single();

      if (documentError) {
        throw documentError;
      }

      document = newDocument;
      
      // Générer les mémocartes directement à partir du document avec Document QnA
      flashcards = await generateMemocardsFromDocument(fileStorage.path, numberOfCards, difficultParts, isStoredInBlob);
    }

    // Créer une nouvelle liste de flashcards
    const { data: flashcardList, error: listError } = await supabase
      .from('flashcard_lists')
      .insert([
        {
          user_id: userId,
          document_id: document.id,
          title: `Mémocartes - ${document.title}`,
          description: `Liste de mémocartes générée à partir de ${document.title}`,
          card_count: flashcards.length
        }
      ])
      .select()
      .single();

    if (listError) {
      throw listError;
    }

    // Stocker chaque mémocarte dans Supabase avec l'ID de la liste
    const flashcardsPromises = flashcards.map(card => 
      supabase
        .from('flashcards')
        .insert([
          {
            user_id: userId,
            document_id: document.id,
            list_id: flashcardList.id,
            question: card.question,
            answer: card.answer
          }
        ])
    );
    
    await Promise.all(flashcardsPromises);

    return res.status(200).json({
      success: true,
      document: document,
      flashcardList: flashcardList,
      flashcardsCount: flashcards.length
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
