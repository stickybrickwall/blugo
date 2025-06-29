import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getTagMaxScores } from '../db/queries/tags';
import { getUserTagScores } from '../db/queries/userTagScores';
import { getProductTagScores } from '../db/queries/productTagScores';
import { getBlockedIngredients } from '../db/queries/blocklist';
import { getProductIngredients } from '../db/queries/productIngredients';
import { getProductDetails } from '../db/queries/products';
import { filterByBlocklist, filterByBudget } from '../services/filter';
import { selectTopPerCategory } from '../services/selector';
import { computeProductScores } from '../services/scorer';

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
      console.log('💾 Product details fetched:', Object.keys(productDetails).length);
      
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
      const topProducts = selectTopPerCategory(budgetFiltered, productDetails);
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
      res.json({ recommendations: readableRecommendations });
    } catch (err) {
      console.error('Recommendation generaion failed: ', err);
      res.status(500).json({ error: 'Recommendation generation failed' });
    }
  })()
});

export default router;
