// Select top product per category

import { ProductDetails } from '../db/queries/products';

type Product = {
    product_id: number;
    name: string;
    category_id: number;
    price: number;
    ingredients?: Record<string, number>; 
};

type Result = {
    id: number;
    name: string;
    category_id: number;
    price: number;
    score: number;
    ingredients?: Record<string, number>;
};

export function selectTopPerCategory(
    productScores: Record<number, number>, 
    productDetails: Record<number, ProductDetails>,
): Record<number, Result> {
    const grouped = new Map<number, ProductDetails[]>();

    for (const product of Object.values(productDetails)) {
        if (!(product.id in productScores)) continue;
        if (!grouped.has(product.category)) {
            grouped.set(product.category, []);
        }
        grouped.get(product.category)!.push(product);
    }

    const topPerCategory: Record<number, Result> = {};

    for (const [catId, products] of grouped.entries()) {
        let topProduct = products[0];

        for (const product of products) {
            if (productScores[product.id] >
                productScores[topProduct.id]
            ) {
                topProduct = product;
            }
        }

        const pid = topProduct.id;

        topPerCategory[catId] = {
            id: pid,
            name: topProduct.name,
            category_id: topProduct.category,
            price: topProduct.price,
            score: productScores[pid],
        };

    }
    return topPerCategory;
}