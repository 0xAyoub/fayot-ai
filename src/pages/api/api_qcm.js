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
async function generateQCMFromText(content, numberOfQuestions) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a professional educator creating multiple-choice questions (QCM) for students. Each question should have exactly 4 options, with only one correct answer. Make the options plausible but only one should be correct. Return ONLY a JSON array with no Markdown formatting."
      },
      {
        role: "user",
        content: `Create ${numberOfQuestions} multiple-choice questions from the following content. Format each question as a JSON object with these fields: 
        1. 'question': the question text
        2. 'correctAnswer': the correct answer text
        3. 'options': an array of 4 choices including the correct answer
        
        Return the result as a JSON array. No markdown formatting, pure JSON only.
        
        Content: ${content}`
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
    
    // Au lieu de lancer une erreur, on renvoie une question d'erreur
    return [
      {
        question: "Erreur lors de la génération",
        correctAnswer: "Réessayer",
        options: ["Réessayer", "Contacter le support", "Vérifier la connexion", "Utiliser un autre document"]
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
    const numberOfQuestions = parseInt(numberOfCards) || 10;

    if (!file || !userId) {
      return res.status(400).json({ error: 'Champs requis manquants' });
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
      questions = await generateQCMFromText(content, numberOfQuestions);
    } else if (file.mimetype.startsWith('image/')) {
      // Pour les images: analyser directement avec GPT-4o (capacité de vision)
      content = await analyzeImageWithGPT4o(file.path);
      questions = await generateQCMFromText(content, numberOfQuestions);
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
    for (const question of questions) {
      const { error: questionError } = await supabase
        .from('quiz_questions')
        .insert([
          {
            quiz_id: quiz.id,
            question: question.question,
            correct_answer: question.correctAnswer,
            options: JSON.stringify(question.options)
          }
        ]);

      if (questionError) {
        throw questionError;
      }
    }

    // Nettoyer le fichier temporaire
    fs.unlinkSync(file.path);

    return res.status(200).json({
      success: true,
      document: document,
      quizId: quiz.id,
      questionsCount: questions.length
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
