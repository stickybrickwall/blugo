// Retrieve and normalise user tag scores

import pool from '../db';

export async function getUserTagScores(userId: number): Promise<Record<number, number>> {
    const query = `
        SELECT tag_id, score
        FROM user_tag_scores
        WHERE user_id = $1
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