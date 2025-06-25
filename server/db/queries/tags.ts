import pool from '../db'

export async function getTagMaxScores(): Promise<Record<number, number>> {
    const result = await pool.query('SELECT id, max_score FROM tags');
    const map: Record<number, number> = {};
    for (const row of result.rows) {
        map[row.id] = row.max_score;
    }
    return map;
}