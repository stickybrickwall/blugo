// Helper filters for blocklist and budget

import { ProductDetails } from '../db/queries/products';

export function filterByBlocklist(
    productScores: Record<number, number>, 
    blockedIngredients: Set<number>, 
    productIngredients: Record<number, number[]>,
    allowTolerance: boolean = false
): Record<number, number> {
    const result: Record<number, number> = {};

    for (const[prodIdStr, score] of Object.entries(productScores)) {
        const prodId = +prodIdStr;
        const ingredients = productIngredients[prodId] || [];

        const blockedCount = ingredients.filter(ing => blockedIngredients.has(ing)).length;
        const ratio = blockedCount / ingredients.length;

        const allow = allowTolerance ? ratio <= 0.2 : blockedCount === 0;

        if (allow) result[prodId] = score;
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

    let maxBudget = Infinity;

    if (budgetScore === 2) {
        maxBudget = 20;
    } else if (budgetScore === 1) {
        maxBudget = 30;
    } else if (premiumScore === 1) {
        maxBudget = 50;
    } else if (premiumScore === 2) {
        maxBudget = Infinity;
    }

    let filtered: Record<number, number> = {};

    for (const prodIdStr in productScores) {
        const prodId = Number(prodIdStr);
        const product = productDetails[prodId];
        if (!product) continue;

        if (product.price <= maxBudget) {
        filtered[prodId] = productScores[prodId];
        }
    }
    return filtered;
    }
