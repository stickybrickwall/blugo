// Retrieve product info (id, name, category, price)

import pool from '../db';

export interface ProductDetails {
    id: number;
    name: string;
    category: number;
    price: number;
}
export async function getProductDetails(): Promise<Record<number, ProductDetails>> {
    const result = await pool.query(`
        SELECT id, product_name AS name, category, price
        FROM products
    `);

    const map: Record<number, ProductDetails> = {}

    for (const row of result.rows) {
        map[row.id] = {
            id: row.id,
            name: row.name,
            category: row.category,
            price: row.price
        };
    }

    return map;
}