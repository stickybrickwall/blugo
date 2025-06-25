// Computes product scores and filters

export function computeProductScores(
    productTagScores: Record<number, Record<number, number>>, 
    userScores: Record<number, number>
): Record<number, number> {
    const scores: Record<number, number> = {};
    for (const [productIdStr, tagWeights] of Object.entries(productTagScores)) {
        const productId = +productIdStr;
        let total = 0;
        for (const [tagIdStr, weight] of Object.entries(tagWeights)) {
            const tagId = +tagIdStr;
            total += (userScores[tagId] || 0) * weight;
        }
        scores[productId] = total;
    }
    return scores;
}