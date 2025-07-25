import { Request, Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getTagMaxScores } from '../db/queries/tags';
import { getUserTagScores } from '../db/queries/userTagScores';
import { getProductTagScores } from '../db/queries/productTagScores';
import { getBlockedIngredients } from '../db/queries/blocklist';
import { getProductIngredients } from '../db/queries/productIngredients';
import { getTagIngredientMap } from '../db/queries/ingredientScores';
import { getProductDetails } from '../db/queries/products';
import { getIngredientNames } from '../db/queries/ingredients';
import { filterByBlocklist, filterByBudget } from '../services/filter';
import { selectTopPerCategory } from '../services/selector';
import { computeProductScores } from '../services/scorer';
import { computeIngredientScores } from '../services/scorer';
import pool from '../db/db';

const router = Router();

router.post('/recommendations', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  console.log('Recommendations route hit');
  (async() => {
    const CATEGORY_MAP: Record<number, string> = {
    1: 'cleanser',
    2: 'toner',
    3: 'serum',
    4: 'moisturiser'
    };

    const SKIN_CONCERN_TAGS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    const REQUIRED_CATEGORIES = Object.keys(CATEGORY_MAP).map(Number); 
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const userId = req.user.id;
      console.log('User ID:', userId);

    // Step 1: Load user scores and normalise
      const tagScores = await getUserTagScores(userId); // { tag_id: score }
      console.log('Tag scores:', tagScores);
      const maxScores = await getTagMaxScores();        // { tag_id: max_score }
      const normalised: Record<number, number> = {};
      for (const tagId in tagScores) {
        const max = maxScores[+tagId];
        if (max) normalised[+tagId] = tagScores[+tagId] / max;
      }
      console.log('Normalised scores:', normalised);

    // Step 2: Score each product
      const productTagScores = await getProductTagScores();
      console.log('Total products in productTagScores:', Object.keys(productTagScores).length);
      const productScores = computeProductScores(productTagScores, normalised); // { product_id: score }
      console.log('Computed product scores (sample):', Object.entries(productScores).slice(0, 5));

    // Step 3: Filter by budget
      const productDetails = await getProductDetails();
      console.log('Product details fetched:', Object.keys(productDetails).length);
      
      const budgetFiltered = filterByBudget(productScores, normalised, productDetails);
      console.log('Products after budget filter:', Object.keys(budgetFiltered).length);
      if (Object.keys(budgetFiltered).length === 0) {
        console.warn('⚠️ All products removed by budget filter');
        return res.status(400).json({ error: 'All products removed due to budget preferences.' });
      }

    // Step 4: Filter by blocklist
    // First attempt at filtering.
      const sensitiveTagIds = Object.entries(normalised)
        .filter(([_, score]) => score >= 0.7) 
        .map(([tagId]) => +tagId);

      console.log('Filtering blocklist by sensitive tags:', sensitiveTagIds);
      const blockedIngredients = await getBlockedIngredients(sensitiveTagIds);
      console.log('Blocked ingredient IDs:', [...blockedIngredients]);

      const productIds = Object.keys(budgetFiltered).map(Number);
      const productIngredients = await getProductIngredients(productIds);
      console.log('Total product ingredients fetched:', Object.keys(productIngredients).length);
      let filteredProducts = filterByBlocklist(budgetFiltered, blockedIngredients, productIngredients);
      console.log('Products after strict blocklist:', Object.keys(filteredProducts).length);


      const hasRequired = (catId: number) => {
        return Object.keys(filteredProducts).some(pid => productDetails[+pid]?.category === catId);
      };

      const missingCategories = REQUIRED_CATEGORIES.filter(catId => !hasRequired(catId));
      console.log('Missing categories after strict filter:', missingCategories);

      // If overfiltered: Second attempt at filtering with more lenient blocked list filter.
      if (missingCategories.length > 0) {
        console.warn('Retrying blocklist filter with tolerance (≤20% blocked ingredients allowed)');
        filteredProducts = filterByBlocklist(productScores, blockedIngredients, productIngredients, true);
        console.log('Products after tolerant blocklist:', Object.keys(filteredProducts).length);
      }

      if (Object.keys(filteredProducts).length === 0) {
        console.warn('⚠️ All products removed by blocklist filter');
        return res.status(400).json({ error: 'All products removed due to blocked ingredients.' });
      }

    // Step 5: Select top product per category
      const topProducts = selectTopPerCategory(filteredProducts, productDetails);
      console.log('Final recommendations:', topProducts);

      const readableRecommendations: Record<string, any> = {};
      for (const [catId, product] of Object.entries(topProducts)) {
        const name = CATEGORY_MAP[+catId];
        if (name) {
            readableRecommendations[name] = product;
        } else {
          console.warn(`⚠️ Unmapped category ID ${catId} in results`);
        }
      }
      console.log('Final recommendations to frontend:', readableRecommendations);

    // Step 6: Send Top Tags and Ingredients
      const skinConcernScores = Object.entries(normalised)
        .filter(([tagId]) => SKIN_CONCERN_TAGS.has(+tagId))
        .map(([tagId, score]) => ({ tagId: +tagId, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0,4);

      const tagIngredientMap = await getTagIngredientMap();
      const ingredientScores = computeIngredientScores(tagIngredientMap, normalised);
      const unblockedIngredientScores = Object.entries(ingredientScores)
        .filter(([ingredientIdStr]) => !blockedIngredients.has(+ingredientIdStr))
        .sort((a, b) => b[1] - a[1])
        .slice(0,10)
        .map(([ingredientId, score]) => ({ ingredientId: +ingredientId, score }));

      const ingredientIds = unblockedIngredientScores.map(i => i.ingredientId);
      const ingredientNameMap = await getIngredientNames(ingredientIds);
      const topIngredientsWithNames = unblockedIngredientScores.map(({ ingredientId, score }) => ({
        ingredientId,
        name: ingredientNameMap[ingredientId] || 'Unknown',
        score
      }));
      
      
    // Step 7: Save results
      await pool.query(`
        INSERT INTO user_recommendations (user_id, recommendations, skin_concerns, ingredients, updated_at)
        VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          recommendations = EXCLUDED.recommendations, 
          skin_concerns = EXCLUDED.skin_concerns,
          ingredients = EXCLUDED.ingredients,
          updated_at = NOW();
      `, [
          userId, 
          JSON.stringify(readableRecommendations),
          JSON.stringify(skinConcernScores),
          JSON.stringify(topIngredientsWithNames),
        ]);

      res.json({ 
        recommendations: readableRecommendations,
        topSkinConcerns: skinConcernScores,
        topIngredients: topIngredientsWithNames 
       });

    } catch (err) {
      console.error('Recommendation generaion failed: ', err);
      res.status(500).json({ error: 'Recommendation generation failed' });
    }
  })()
});

router.get('/latest', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { rows } = await pool.query(`
      SELECT 
        recommendations, 
        skin_concerns AS "topSkinConcerns", 
        ingredients AS "topIngredients",
        updated_at AS "latestResponse"
      FROM user_recommendations
      WHERE user_id = $1
    `, [userId]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'No recommendations found' });
      return;
    }

    const { recommendations, topSkinConcerns, topIngredients, latestResponse } = rows[0];

    res.json({ recommendations, topSkinConcerns, topIngredients, latestResponse });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch past recommendations' });
  }
});

export default router;
