import pool from '../db';

export async function getIngredientNames(ids: number[]): Promise<Record<number, string>> {
  if (ids.length === 0) return {};

  const result = await pool.query(
    `SELECT id, ingredient_name FROM ingredients WHERE id = ANY($1)`,
    [ids]
  );

  const map: Record<number, string> = {};
  for (const row of result.rows) {
    map[row.id] = row.ingredient_name;
  }

  return map;
}