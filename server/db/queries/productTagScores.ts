// Fetch precomputed product_tag_scores
import pool from '../db';

export async function getProductTagScores(): Promise<Record<number, Record<number, number>>> {
    const result = await pool.query(`
        SELECT product_id, tag_id, score FROM product_tag_score
    `);

    const map: Record<number, Record<number, number>> = {}

    for (const row of result.rows) {
        if (!map[row.product_id]) map[row.product_id] = {};
        map[row.product_id][row.tag_id] = row.score;
    }
    return map;
}