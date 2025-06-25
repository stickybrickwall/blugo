// Get blocked ingredients by tag

import pool from '../db';

export async function getBlockedIngredients(tagIds: number[]): Promise<number[]> {
    const result = await pool.query(`
        SELECT ingredient_id
        FROM tag_ingredient_blocklist
        WHERE tag_id = ANY($1)
    `, [tagIds]
    );

    return result.rows.map(row => row.ingredient_id);
}