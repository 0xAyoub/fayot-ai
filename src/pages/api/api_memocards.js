import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import PDFParser from 'pdf2json';

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY || supabaseKey);

// Configuration multer pour le stockage des fichiers
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});

// Fonction pour extraire le texte d'un PDF
async function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        const text = pdfData.Pages.map(page => 
          page.Texts.map(text => decodeURIComponent(text.R[0].T)).join(' ')
        ).join('\n');
        resolve(text);
      } catch (error) {
        console.error("Erreur lors de l'extraction du texte:", error);
        reject(error);
      }
    });
    
    pdfParser.on('pdfParser_dataError', (error) => {
      console.error("Erreur lors du parsing du PDF:", error);
      reject(error);
    });
    
    pdfParser.loadPDF(filePath);
  });
}

// Fonction pour analyser une image avec GPT-4o
async function analyzeImageWithGPT4o(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image and extract the educational content from it. Provide a detailed explanation of the concepts shown."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  });
  
  return response.choices[0].message.content;
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

// Fonction pour générer des mémocartes avec GPT-4o à partir de texte
async function generateMemocardsFromText(content, numberOfCards) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a professional educator creating flashcards for students. Create concise, clear, and educational question-answer pairs. Return ONLY the JSON array with no Markdown formatting or additional text."
      },
      {
        role: "user",
        content: `Create ${numberOfCards} flashcards from the following content. Format each flashcard as a JSON object with 'question' and 'answer' fields within an array. No markdown formatting, just pure JSON: ${content}`
      }
    ],
    max_tokens: 2000
  });

  const flashcardsText = response.choices[0].message.content;
  try {
    // Essayer de parser directement
    try {
      return JSON.parse(flashcardsText);
    } catch (directParseError) {
      // Si ça échoue, extraire le JSON potentiel du markdown
      const extractedJSON = extractJSONFromMarkdown(flashcardsText);
      
      try {
        return JSON.parse(extractedJSON);
      } catch (extractedParseError) {
        // Plan B: transformer le texte en flashcards nous-mêmes
        // si la structure ressemble à des flashcards mais n'est pas du JSON valide
        console.log("Tentative de récupération des flashcards depuis le texte...");
        
        // Recherche de modèles question-réponse dans le texte
        const cards = [];
        const lines = flashcardsText.split('\n');
        let currentQuestion = null;
        
        for (const line of lines) {
          // Chercher des lignes qui semblent être des questions
          if (line.includes("question") || line.includes("?")) {
            // Si on avait déjà une question en cours, la finaliser
            if (currentQuestion && currentQuestion.question) {
              if (!currentQuestion.answer) currentQuestion.answer = "Pas de réponse fournie";
              cards.push(currentQuestion);
            }
            // Démarrer une nouvelle question
            currentQuestion = { question: line.replace(/.*"question"[: ]*"?/, '').replace(/".*/, '').trim() };
            // Supprimer les caractères spéciaux potentiels
            if (currentQuestion.question.endsWith(',') || currentQuestion.question.endsWith('"')) {
              currentQuestion.question = currentQuestion.question.slice(0, -1);
            }
          } 
          // Chercher des lignes qui semblent être des réponses
          else if (currentQuestion && (line.includes("answer") || line.includes("réponse"))) {
            currentQuestion.answer = line.replace(/.*"answer"[: ]*"?/, '').replace(/".*/, '').trim();
            // Supprimer les caractères spéciaux potentiels
            if (currentQuestion.answer.endsWith(',') || currentQuestion.answer.endsWith('"')) {
              currentQuestion.answer = currentQuestion.answer.slice(0, -1);
            }
          }
        }
        
        // Ajouter la dernière question si elle existe
        if (currentQuestion && currentQuestion.question) {
          if (!currentQuestion.answer) currentQuestion.answer = "Pas de réponse fournie";
          cards.push(currentQuestion);
        }
        
        // Si nous avons trouvé au moins une carte, on considère que c'est un succès
        if (cards.length > 0) {
          console.log(`Récupération réussie: ${cards.length} cartes extraites.`);
          return cards;
        }
        
        // Si toutes les tentatives échouent, on génère des cartes factices pour éviter l'échec complet
        if (cards.length === 0) {
          console.error("Impossible d'extraire des flashcards valides. Génération de cartes de secours.");
          return [
            {
              question: "Question récupérée du contenu",
              answer: "Désolé, nous n'avons pas pu générer les flashcards correctement. Veuillez réessayer."
            }
          ];
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors du parsing du JSON:", error);
    console.error("Réponse brute:", flashcardsText);
    
    // Au lieu de lancer une erreur, on renvoie une carte d'erreur
    return [
      {
        question: "Erreur lors de la génération",
        answer: "Nous avons rencontré un problème lors de la génération des flashcards. Veuillez réessayer."
      }
    ];
  }
}

// Route API principale
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    
    // Middleware multer pour gérer le téléchargement de fichier
    await new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    const { file } = req;
    const { userId, numberOfCards } = req.body;

    if (!file || !userId || !numberOfCards) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    
    // Vérifier que l'ID utilisateur correspond à l'utilisateur authentifié
    if (userId !== userData.user.id) {
      return res.status(403).json({ error: 'Non autorisé: l\'ID utilisateur ne correspond pas à l\'utilisateur authentifié' });
    }

    // Extraire le contenu selon le type de fichier
    let content = '';
    let flashcards = [];
    
    // Stocker le document dans Supabase
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert([
        {
          user_id: userId,
          title: file.originalname,
          file_path: file.path,
          file_size: file.size,
          file_type: file.mimetype.split('/')[1]
        }
      ])
      .select()
      .single();

    if (documentError) {
      throw documentError;
    }
    
    // Traitement spécifique selon le type de fichier
    if (file.mimetype === 'application/pdf') {
      // Pour les PDFs: extraire le texte puis utiliser GPT-4o pour générer des mémocartes
      content = await extractTextFromPDF(file.path);
      flashcards = await generateMemocardsFromText(content, numberOfCards);
    } else if (file.mimetype.startsWith('image/')) {
      // Pour les images: analyser directement avec GPT-4o (capacité de vision)
      content = await analyzeImageWithGPT4o(file.path);
      flashcards = await generateMemocardsFromText(content, numberOfCards);
    } else {
      return res.status(400).json({ error: 'Format de fichier non pris en charge' });
    }

    // Créer une nouvelle liste de flashcards
    const { data: flashcardList, error: listError } = await supabase
      .from('flashcard_lists')
      .insert([
        {
          user_id: userId,
          document_id: document.id,
          title: `Mémocartes - ${file.originalname}`,
          description: `Liste de mémocartes générée à partir de ${file.originalname}`,
          card_count: flashcards.length
        }
      ])
      .select()
      .single();

    if (listError) {
      throw listError;
    }

    // Stocker chaque mémocarte dans Supabase avec l'ID de la liste
    for (const card of flashcards) {
      const { error: flashcardError } = await supabase
        .from('flashcards')
        .insert([
          {
            user_id: userId,
            document_id: document.id,
            list_id: flashcardList.id,
            question: card.question,
            answer: card.answer
          }
        ]);

      if (flashcardError) {
        throw flashcardError;
      }
    }

    // Nettoyer le fichier temporaire
    fs.unlinkSync(file.path);

    return res.status(200).json({
      success: true,
      document: document,
      flashcardList: flashcardList,
      flashcardsCount: flashcards.length
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false, // Désactiver le parsing automatique pour utiliser multer
  },
};
