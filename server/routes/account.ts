import { Router, Response, RequestHandler } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import pool from '../db/db';
import bcrypt from 'bcrypt';

const router = Router();

// Change Password
router.post('/account/change-password', authenticate, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Both old and new passwords are required.' });
    }

    const { rows } = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const valid = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Password is valid. Updating DB...');
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashedPassword, userId]);
    console.log('✅ Password updated in database.');

    res.sendStatus(204);
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
}) as RequestHandler
);

// Delete Account
router.delete('/account', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);

    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

export default router;