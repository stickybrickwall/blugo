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
      const userId = decoded.id;

      const { responses } = req.body;
      if (!responses || typeof responses !== 'object') {
        return res.status(400).json({ error: 'Invalid response' });
      }

      const answerValues = Object.values(responses);

      const scoreQuery = `
      SELECT ats.tag_id, SUM(ats.score) AS total_score
      FROM answers a
      JOIN answer_tag_scores ats ON a.id = ats.answer_id
      WHERE a.answer_text = ANY($1)
      GROUP BY ats.tag_id
    `;
    const scoreResult = await pool.query(scoreQuery, [answerValues]);

    const tagScores: Record<number, number> = {};
    for (const row of scoreResult.rows) {
      tagScores[row.tag_id] = Number(row.total_score);
    }

    const allTagIds = Array.from({ length: 18 }, (_, i) => i + 1);
    for (const tagId of allTagIds) {
      if (!(tagId in tagScores)) {
        tagScores[tagId] = 0;
      }
    }

    // Write to user_tag_scores DB
    for (const [tagId, score] of Object.entries(tagScores)) {
      console.log(`Updating user_tag_scores for user ${userId}: Tag ${tagId} = ${score}`);
      await pool.query(`
        INSERT INTO user_tag_scores (user_id, tag_id, score, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, tag_id)
        DO UPDATE SET score = EXCLUDED.score, updated_at = NOW()
      `, [userId, +tagId, score]);
    }

    // Fetch tag_name for storing readable summary
    const nameQuery = `
      SELECT id, tag_name FROM tags WHERE id = ANY($1)
    `;
    const tagIds = Object.keys(tagScores).map(id => Number(id));
    const nameResult = await pool.query(nameQuery, [tagIds]);

    const readableScores: Record<string, number> = {};
    for (const row of nameResult.rows) {
      readableScores[row.tag_name] = tagScores[row.id];
    }

    // Save raw quiz answers + readable tag summary
    await pool.query(
      'INSERT INTO quiz_responses (user_id, responses, tags) VALUES ($1, $2, $3)',
      [userId, responses, readableScores]
    );

    res.json({ message: 'Quiz saved', tags: readableScores });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  })();
});

export default router;