// Retrieve Tag → Ingredient score map
// Milestone 3

import pool from '../db';

export async function getTagIngredientMap(): Promise<Record<number, Record<number, number>>> {
  const result = await pool.query(`
        SELECT tag_id AS tag, ingredient_id, score_weight
        FROM tag_ingredient_map
    `);

    const map: Record<number, Record<number, number>> = {};

    for (const row of result.rows) {
        if (!map[row.tag]) {
        map[row.tag] = {};
        }
        map[row.tag][row.ingredient_id] = row.score_weight;
    }

    return map;
}