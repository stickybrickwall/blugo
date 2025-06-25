import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import pool from '../db/db';

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

      const answerValues = Object.values(responses);

      const tagQuery = `
        SELECT t.tag_name, SUM(ats.score) AS total_score
        FROM answers a
        JOIN answer_tag_scores ats ON a.id = ats.answer_id
        JOIN tags t ON ats.tag_id = t.id
        WHERE a.answer_text = ANY($1)
        GROUP BY t.tag_name;
      `;

      const { rows } = await pool.query(tagQuery, [answerValues]); // Perform tagQuery

      const tagScores: { [tag: string]: number } = {};
      rows.forEach(row => {
        tagScores[row.tag_name] = Number(row.total_score);
      });

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