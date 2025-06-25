import { Router, type Request, type Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import pool from '../db/db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/login', async (req: Request, res: Response) => {
    (async() => {
        try {
            const { email, password } = req.body;

            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = result.rows[0];

            if (!user) {
            return res.status(401).json({ error: 'User not found' });
            }

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ error: 'Incorrect password' });
            }

            const token = jwt.sign({ 
                id: user.id, 
                email: user.email 
            }, JWT_SECRET, { 
                expiresIn: '1h'
            });

            res.json({
                message: 'Login successful',
                token,
                firstName: user.fname,
                lastName: user.lname,
                email: user.email,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error during login' });
        }
    })();
});

router.post('/signup', async (req: Request, res: Response) => {
    (async() => {
        try {
            const { email, password, firstName, lastName } = req.body;

            const existingUser = await pool.query('SELECT * FROM  users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: 'Email already in use, please log in.' });
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const result = await pool.query(
                'INSERT INTO users(email, password_hash, fname, lname) VALUES ($1, $2, $3, $4) RETURNING *',
                [email, hashedPassword, firstName, lastName]
            );

            const user = result.rows[0];

            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        
            return res.status(201).json({
                message: 'Signup successful',
                token,
                firstName: user.fname,
                lastName: user.lname,
                email: user.email,
            });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'Server error during signup' });
            }
        })();
    })

export default router;
