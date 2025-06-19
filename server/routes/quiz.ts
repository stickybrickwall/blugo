import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import pool from '../db';
import { answerToTagMap } from '../mappings/answerToTagMap';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/', async (req: Request, res: Response) => {
  (async() => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'No token provided' });

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const { responses } = req.body;
      if (!responses || typeof responses !== 'object') {
        return res.status(400).json({ error: 'Invalid response' });
      }

      const tagScores: { [tag: string]: number } = {};
      for (const question in responses) {
        const answer = responses[question];
        const mappings = answerToTagMap[question]?.[answer] || [];
        mappings.forEach(({ tag, score }) => {
          tagScores[tag] = (tagScores[tag] || 0) + score;
        });
      }

      await pool.query(
        'INSERT INTO quiz_responses (user_id, responses, tags) VALUES ($1, $2, $3)',
        [decoded.id, responses, tagScores]
      );

      res.json({ message: 'Quiz saved with tags', tags: tagScores });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  })();
});

export default router;