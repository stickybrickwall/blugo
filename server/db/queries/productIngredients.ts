// Retrieve ingredients for products

import pool from '../db';

export async function getProductIngredients(productIds: number[])
: Promise<Record<number, number[]>> {
    const result = await pool.query(`
        SELECT product_id, ingredient_id
        FROM product_ingredients_map
        WHERE product_id = ANY($1)
  ` , [productIds]);

    const map: Record<number, number[]> = {};

    for (const row of result.rows) {
        if (!map[row.product_id]) map[row.product_id] = [];
        map[row.product_id].push(row.ingredient_id);
    }
    return map;
}