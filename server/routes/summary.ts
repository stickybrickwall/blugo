import express, { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import pool from '../db/db';
import { formatQuizResponses } from '../utils/quizFormatter';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/generate-summary', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  (async() => {
    const userId = req.user!.id;

    try {
        // Fetch latest quiz responses
        const { rows } = await pool.query(
        `SELECT responses
            FROM quiz_responses
            WHERE user_id = $1
        ORDER BY created_at DESC
            LIMIT 1`,
        [userId]
        );

        if (rows.length === 0) {
        return res.status(404).json({ error: 'No quiz responses found' });
        }

        const responses = rows[0].responses;
        const formatted = formatQuizResponses(responses);

        const prompt = `
    A user answered a skincare quiz with the following inputs:
    ${formatted}
    All responses with a numerical value are selected from a range of 1 to 5. 
    Based on this, diagnose their skin type and generate a personalised skin profile. Address the user personally. Keep the paragraph succint, less than 70 words, and be insightful.
    `;

        const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
        });

        const message = completion.choices[0].message.content;
        res.json({ summary: message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
  })();
});

export default router;