import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Ollama } from 'ollama';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' });

// Setup express middlewares
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Setup Multer to keep files in memory to pass straight to Ollama
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const SYSTEM_PROMPT = `You are a savage, ruthlessly honest, yet hilarious food critic.
The user is going to show you a photo of their meal. 
Your job is to ROAST IT absolutely relentlessly. Do not hold back. Point out specific flaws in the plating, the apparent texture, and what it looks like it's made of.
At the very end of your response, provide a rating out of 10 in the format: "Rating: X/10".

Keep the roast to a maximum of 3-4 sentences. Be punchy, modern, and absolutely brutal but funny.`;

app.post('/api/roast', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided.' });
    }

    // Ollama accepts base64 strings for images 
    const base64Image = req.file.buffer.toString('base64');

    const response = await ollama.chat({
      model: 'llama3.2-vision:latest',
      messages: [{
        role: 'user',
        content: SYSTEM_PROMPT,
        images: [base64Image]
      }]
    });

    const reply = response.message.content;
    let score = null;
    
    // Attempt to extract the rating, e.g., "Rating: 3/10"
    const scoreMatch = reply.match(/Rating:\s*(\d+)/i);
    score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    res.json({
      success: true,
      data: {
        text: reply,
        score: score
      }
    });

  } catch (error) {
    console.error('Error roasting plate:', error);
    res.status(500).json({ error: 'Failed to process image with LLM.' });
  }
});

// All other GET requests not handled will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
