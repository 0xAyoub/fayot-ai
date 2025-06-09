import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
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

// Fonction pour générer des QCM avec GPT-4o à partir de texte
async function generateQCMFromText(content, numberOfQuestions, difficultParts = '') {
  const prompt = difficultParts 
    ? `Crée ${numberOfQuestions} questions à choix multiples à partir du contenu suivant. Insiste particulièrement sur ces concepts difficiles: ${difficultParts}.`
    : `Crée ${numberOfQuestions} questions à choix multiples à partir du contenu suivant.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Tu es un éducateur professionnel qui crée des QCM pour les étudiants. 
        
        INSTRUCTIONS IMPORTANTES:
        - Chaque question doit avoir exactement 4 options
        - Mélange le nombre de réponses correctes:
          * Environ 60% des questions doivent avoir 1 réponse correcte
          * Environ 30% des questions doivent avoir 2 réponses correctes
          * Environ 10% des questions doivent avoir 3 réponses correctes
          * JAMAIS de questions avec 0 ou 4 réponses correctes
        - Les options correctes doivent être mélangées aléatoirement parmi les options
        - Les options incorrectes doivent être plausibles mais clairement fausses
        - Retourne UNIQUEMENT un tableau JSON sans formatage Markdown
        
        Format JSON attendu:
        [
          {
            "question": "Le texte de la question",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctOptions": [0, 2], // indices des options correctes (0-indexé)
            "explanation": "Explication courte de la réponse correcte"
          },
          ...
        ]`
      },
      {
        role: "user",
        content: `${prompt}
        
        Contenu: ${content}
        
        Retourne un tableau JSON avec des questions à choix multiples. Chaque question doit suivre exactement le format demandé, avec un nombre variable de bonnes réponses (1, 2 ou 3 mais jamais 0 ou 4).`
      }
    ],
    max_tokens: 3000
  });

  const questionsText = response.choices[0].message.content;
  
  try {
    // Essayer de parser directement
    try {
      return JSON.parse(questionsText);
    } catch (directParseError) {
      // Si ça échoue, extraire le JSON potentiel du markdown
      const extractedJSON = extractJSONFromMarkdown(questionsText);
      
      try {
        return JSON.parse(extractedJSON);
      } catch (extractedParseError) {
        console.error("Impossible de parser le JSON des questions:", extractedParseError);
        throw new Error("Erreur lors de la génération des questions");
      }
    }
  } catch (error) {
    console.error("Erreur lors du parsing du JSON:", error);
    console.error("Réponse brute:", questionsText);
    
    // Au lieu de lancer une erreur, on renvoie des questions d'erreur
    return [
      {
        question: "Erreur lors de la génération des questions",
        options: ["Réessayer", "Contacter le support", "Vérifier la connexion", "Utiliser un autre document"],
        correctOptions: [0],
        explanation: "Une erreur est survenue lors de la génération des questions."
      }
    ];
  }
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
    
    // Middleware multer pour gérer le téléchargement de fichier
    await new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    const { file } = req;
    const userId = req.body.userId;
    const numberOfQuestions = parseInt(req.body.numberOfCards) || 10;
    const difficultParts = req.body.difficultParts || '';

    if (!file || !userId) {
      return res.status(400).json({ error: 'Fichier ou ID utilisateur manquant' });
    }
    
    // Vérifier que l'ID utilisateur correspond à l'utilisateur authentifié
    if (userId !== userData.user.id) {
      return res.status(403).json({ error: 'Non autorisé: l\'ID utilisateur ne correspond pas à l\'utilisateur authentifié' });
    }

    // Extraire le contenu selon le type de fichier
    let content = '';
    let questions = [];
    
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
      // Pour les PDFs: extraire le texte puis utiliser GPT-4o pour générer des QCM
      content = await extractTextFromPDF(file.path);
      questions = await generateQCMFromText(content, numberOfQuestions, difficultParts);
    } else if (file.mimetype.startsWith('image/')) {
      // Pour les images: analyser directement avec GPT-4o (capacité de vision)
      content = await analyzeImageWithGPT4o(file.path);
      questions = await generateQCMFromText(content, numberOfQuestions, difficultParts);
    } else {
      return res.status(400).json({ error: 'Format de fichier non pris en charge' });
    }

    // Créer un nouveau quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([
        {
          user_id: userId,
          title: `Quiz - ${file.originalname}`,
          description: `Quiz généré à partir de ${file.originalname}`
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
