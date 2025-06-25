// Retrieve and normalise user tag scores

import pool from '../db';

export async function getUserTagScores(userId: String): Promise<Record<number, number>> {
    const query = `
        SELECT tags
        FROM quiz_responses
        WHERE user_id = $1
        ORDER BY submitted_at DESC
        LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
        throw new Error('No quiz results found for this user.');
    }

    const scores: Record<number, number> = {};
    for (const row of result.rows) {
        scores[row.tag_id] = row.score;
    }
    return scores;
}