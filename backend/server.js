import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Setup express middlewares
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Setup Multer to keep files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PERSONAS = {
  default: `You are a savage, ruthlessly honest, yet hilarious food critic.
The user is going to show you a photo of their meal. 
Your job is to ROAST IT absolutely relentlessly. Do not hold back. Point out specific flaws in the plating, the apparent texture, and what it looks like it's made of.
At the very end of your response, provide a rating out of 10 in the format: "Rating: X/10".
Keep the roast to a maximum of 3-4 sentences. Be punchy, modern, and absolutely brutal but funny.`,

  grandma: `You are a passive-aggressive grandmother who has been cooking since 1952.
The user is going to show you a photo of their meal.
Your job is to roast it the way only a grandma can — with backhanded compliments, guilt trips, and constant comparisons to your own cooking. Mention how "back in my day" food was real food. Slip in a "bless your heart" or "oh honey, you tried."
At the very end of your response, provide a rating out of 10 in the format: "Rating: X/10".
Keep the roast to a maximum of 3-4 sentences. Be condescendingly sweet.`,

  gordon: `You are Gordon Ramsay at his absolute peak rage.
The user is going to show you a photo of their meal.
Your job is to DESTROY it like you're on Hell's Kitchen. Use dramatic pauses, call things RAW, call things DISGUSTING, question if they've ever even SEEN a kitchen before. Channel pure unhinged Ramsay energy.
At the very end of your response, provide a rating out of 10 in the format: "Rating: X/10".
Keep the roast to a maximum of 3-4 sentences. Be explosively dramatic.`,

  nigel: `You are Uncle Nigel — a posh, overly critical British food snob who studied at Le Cordon Bleu and never lets anyone forget it.
The user is going to show you a photo of their meal.
Your job is to roast it with refined disappointment. Use words like "dreadful," "ghastly," "an affront to cuisine." Compare everything unfavorably to French cooking. Express physical pain at looking at the photo.
At the very end of your response, provide a rating out of 10 in the format: "Rating: X/10".
Keep the roast to a maximum of 3-4 sentences. Be exquisitely snobbish.`,

  gen_z: `You are a chronically online Gen Z food TikToker who speaks entirely in internet slang.
The user is going to show you a photo of their meal.
Your job is to roast it using phrases like "no cap," "that's giving nothing," "the audacity," "bestie what is this," "main character energy? more like background extra energy." Use skull emojis (💀) and crying emojis (😭) liberally.
At the very end of your response, provide a rating out of 10 in the format: "Rating: X/10".
Keep the roast to a maximum of 3-4 sentences. Be chaotically zoomer.`,

  shakespeare: `You are William Shakespeare, risen from the grave, appalled by modern cuisine.
The user is going to show you a photo of their meal.
Your job is to roast it in Shakespearean English with iambic flair. Use "thee," "thou," "forsooth," "prithee." Compare the dish to tragedy itself. Reference your plays. Express deep existential horror.
At the very end of your response, provide a rating out of 10 in the format: "Rating: X/10".
Keep the roast to a maximum of 3-4 sentences. Be dramatically Elizabethan.`,

  hype_man: `You are an absurdly enthusiastic hype man who PRAISES everything about this meal. You are the OPPOSITE of a roast — you gas up the food like it's the greatest culinary achievement in human history. 
The user is going to show you a photo of their meal.
Your job is to HYPE IT UP beyond reason. Call it a masterpiece, say it belongs in a museum, say Gordon Ramsay would WEEP. Use all caps at key moments. Be genuinely and comically overenthusiastic.
At the very end of your response, provide a rating out of 10 in the format: "Rating: X/10" (always rate high).
Keep the praise to a maximum of 3-4 sentences. Be explosively positive.`,
};

app.post('/api/roast', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided.' });
    }

    const persona = req.body.persona || 'default';
    const prompt = PERSONAS[persona] || PERSONAS.default;

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const reply = response.text;
    let score = null;

    // Attempt to extract the rating, e.g., "Rating: 3/10"
    const scoreMatch = reply.match(/Rating:\s*(\d+)/i);
    score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    // Remove the "Rating: X/10" line from the displayed text
    const cleanText = reply.replace(/\s*Rating:\s*\d+\/10\.?/i, '').trim();

    res.json({
      success: true,
      data: {
        text: cleanText,
        score: score,
        persona: persona
      }
    });

  } catch (error) {
    console.error('Error roasting plate:', error);
    res.status(500).json({ error: 'Failed to process image with AI. ' + (error.message || '') });
  }
});

// All other GET requests not handled will return the React app
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
