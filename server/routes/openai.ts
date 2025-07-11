import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/generate-summary', async (req, res) => {
  const { concerns } = req.body;

  try {
    const prompt = `Write a personalized paragraph to help the user understand their skin better based on these skin concerns: ${concerns.join(', ')}. Avoid rephrasing the concerns. Instead, offer meaningful insights and what this says about their skin profile. 3 to 5 sentences. Succint and insightful.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const message = completion.choices[0].message.content;
    res.json({ summary: message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;