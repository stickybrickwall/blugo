// Get blocked ingredients by tag

import pool from '../db';

export async function getBlockedIngredients(tagIds: number[]): Promise<Set<number>> {
    const result = await pool.query(`
        SELECT ingredient_id
        FROM tag_ingredient_blocklist
        WHERE tag_id = ANY($1)
    `, [tagIds]
    );

    const ingredientIds = result.rows.map(row => row.ingredient_id);
    return new Set<number>(ingredientIds);
}