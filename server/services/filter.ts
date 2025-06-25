// Helper filters for blocklist and budget

import { ProductDetails } from '../db/queries/products';

export function filterByBlocklist(
    productScores: Record<number, number>, 
    blockedIngredients: Set<number>, 
    productIngredients: Record<number, number[]>
): Record<number, number> {
    const result: Record<number, number> = {};

    for (const[prodIdStr, score] of Object.entries(productScores)) {
        const prodId = +prodIdStr;
        const ingredients = productIngredients[prodId] || [];
        const isBlocked = ingredients.some(ing => blockedIngredients.has(ing));
        if (!isBlocked) result[prodId] = score;
    }
    return result;
}

export function filterByBudget(
    productScores: Record<number, number>, 
    userScores: Record<number, number>,
    productDetails: Record<number, ProductDetails>
): Record<number, number> {
    const budgetScore = userScores[18] || 0;
    const premiumScore = userScores[19] || 0;

    let filtered: Record<number, number> = {};

    for (const prodIdStr in productScores) {
        const prodId = Number(prodIdStr);
        const product = productDetails[prodId];
        if (!product) continue;

        const price = product.price;

        if (budgetScore > premiumScore && price <= 30) {
            filtered[prodId] = productScores[prodId];
        } else if (premiumScore > budgetScore) {
            filtered[prodId] = productScores[prodId];
        } else if (budgetScore === premiumScore) {
            filtered[prodId] = productScores[prodId];
        }
    }
    return filtered;
    }
