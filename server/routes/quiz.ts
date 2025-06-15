import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import pool from '../db';

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
      if (!responses) return res.status(400).json({ error: 'No responses provided' });

      await pool.query(
        'INSERT INTO quiz_responses (user_id, responses) VALUES ($1, $2)',
        [decoded.id, responses]
      );

      res.json({ message: 'Quiz saved' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  })();
});

export default router;