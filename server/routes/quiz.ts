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

      console.log('📩 Received responses:', JSON.stringify(responses, null, 2)); 

      // Fetch all questions n answers
      const { rows: allQuestions } = await pool.query(`SELECT id, text FROM questions`);
      const { rows: allAnswers } = await pool.query(`SELECT id, question_id, answer_text FROM answers`);

      const tagScores: Record<number, number> = {};

      // Helper to accumulate tag scores
      const accumulate = (rows: { tag_id: number; score: number }[]) => {
        for (const { tag_id, score } of rows) {
          tagScores[tag_id] = (tagScores[tag_id] || 0) + score;
        }
      };

      // MAIN scoring logic
      for (const [questionText, value] of Object.entries(responses)) {
        console.log(`➡️ Processing question: "${questionText}" with value:`, value);
        const question = allQuestions.find(q => q.text === questionText);
        if (!question) continue;

        // SINGLE question type
        if (typeof value === 'string') {
          const answer = allAnswers.find(
            a => a.question_id === question.id && a.answer_text === value
          );
          console.log(`🔎 Matched answer for "${questionText}":`, answer);

          if (!answer) continue;

          const { rows } = await pool.query(
            `SELECT tag_id, score FROM answer_tag_scores WHERE answer_id = $1`,
            [answer.id]
          );
          accumulate(rows);
        }

        // MULTI question type
        else if (Array.isArray(value)) {
          for (const v of value) {
            const answer = allAnswers.find(
              a => a.question_id === question.id && a.answer_text === v
            );
            console.log(`🔎 Matched MULTI answer for "${questionText}" value "${v}":`, answer);

            if (!answer) continue;

            const { rows } = await pool.query(
              `SELECT tag_id, score FROM answer_tag_scores WHERE answer_id = $1`,
              [answer.id]
            );
            console.log(`🏷️ Tag scores for answer ID ${answer.id}:`, rows);
            accumulate(rows);
          }
        }

        // SCALE question type
        else if (typeof value === 'number') {
          const scaleFactorMap = {
            1: 0,
            2: 0.25,
            3: 0.5,
            4: 0.75,
            5: 1
          };

          const factor = scaleFactorMap[value as 1 | 2 | 3 | 4 | 5] ?? 0;

          const { rows } = await pool.query(
            `SELECT tag_id, score FROM answer_tag_scores WHERE question_id = $1 AND answer_id IS NULL`,
            [question.id]
          );

          // Multiply scores by scale factor
          const scaledRows = rows.map(row => ({
            tag_id: row.tag_id,
            score: row.score * factor
          }))

          accumulate(scaledRows);
        }
      }

      // Fill in zeroes for any missing tags
      const { rows: tagRows } = await pool.query('SELECT id FROM tags');
      const allTagIds = tagRows.map(r => r.id);
      for (const tagId of allTagIds) {
        if (!(tagId in tagScores)) {
          tagScores[tagId] = 0;
        }
      }

      console.log('✅ Final tagScores before save:', tagScores);

      // Fill up user_tag_scores table
      for (const [tagId, score] of Object.entries(tagScores)) {
        await pool.query(
          `
          INSERT INTO user_tag_scores (user_id, tag_id, score, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id, tag_id)
          DO UPDATE SET score = EXCLUDED.score, updated_at = NOW()
        `,
          [userId, +tagId, score]
        );
      }

      // Fetch tag_name for readable summary
      const tagIds = Object.keys(tagScores).map(id => Number(id));
      const nameResult = await pool.query(
        `SELECT id, tag_name FROM tags WHERE id = ANY($1)`,
        [tagIds]
      );

      const readableScores: Record<string, number> = {};
      for (const row of nameResult.rows) {
        readableScores[row.tag_name] = tagScores[row.id];
      }

      // Save raw responses
      await pool.query(
        'INSERT INTO quiz_responses (user_id, responses, tags) VALUES ($1, $2, $3)',
        [userId, responses, readableScores]
      );

      res.json({ message: 'Quiz saved', tags: readableScores });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  })()
});

export default router;