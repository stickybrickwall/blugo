// Computes product scores and filters

export function computeProductScores(
    productTagScores: Record<number, Record<number, number>>, 
    userScores: Record<number, number>
): Record<number, number> {
    const scores: Record<number, number> = {};

    // Finds the top 3 user concern tags
    const topTags = Object.entries(userScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tagIdStr]) => +tagIdStr);

    for (const [productIdStr, tagWeights] of Object.entries(productTagScores)) {
        const productId = +productIdStr;
        let total = 0;
        for (const [tagIdStr, weight] of Object.entries(tagWeights)) {
            const tagId = +tagIdStr;
            let userScore = userScores[tagId] || 0;

            // Boost the top 3  user concern tags
            if (topTags.includes(tagId)) {
                userScore *= 1.5;
            }
            // Scale the weight using a logarithmic function to reduce the impact of very high weights
            const scaledWeight = Math.log(1 + weight);
            console.log(`Tag ${tagId}: raw=${weight}, scaled=${scaledWeight}, boostedUserScore=${userScore}`);
            total += userScore * scaledWeight;
        }
        scores[productId] = total;
    }
    console.log('Top 3 products by match score:', 
        Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
    );
    return scores;
}