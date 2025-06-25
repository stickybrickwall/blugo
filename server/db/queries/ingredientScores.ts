// Retrieve Tag → Ingredient score map
// Milestone 3

import pool from '../db';

export async function getTagIngredientMap(): Promise<Record<string, Record<number, number>>> {
  const result = await pool.query(`
        SELECT t.name AS tag, ti.ingredient_id, ti.score_weight
        FROM tag_ingredient_map ti
        JOIN tags t ON ti.tag_id = t.id
    `);

    const map: Record<string, Record<number, number>> = {};

    for (const row of result.rows) {
        if (!map[row.tag]) {
        map[row.tag] = {};
        }
        map[row.tag][row.ingredient_id] = row.score_weight;
    }

    return map;
}