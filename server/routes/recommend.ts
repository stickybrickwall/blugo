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
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const userId = req.user.id;
      console.log('User ID:', userId);

    // Step 1: Load user scores and tag metadata
      const tagScores = await getUserTagScores(userId); // { tag_id: score }
      console.log('Tag scores:', tagScores);
      const maxScores = await getTagMaxScores();        // { tag_id: max_score }
      console.log('Max scores:', maxScores);

    // Step 2: Normalize user scores
      const normalised: Record<number, number> = {};
      for (const tagId in tagScores) {
        const max = maxScores[+tagId];
        if (max) normalised[+tagId] = tagScores[+tagId] / max;
      }
      console.log('Normalised scores:', normalised);

    // Step 3: Score each product using precomputed tag-product score
      const productTagScores = await getProductTagScores();
      const productScores = computeProductScores(productTagScores, normalised); // { product_id: score }
      console.log('Product scores:', productScores);

    // Step 4: Filter by blocklist
      const normUserScore = Object.keys(normalised).map(Number);
      const blockedIngredients = await getBlockedIngredients(normUserScore);
      const productIds = Object.keys(productScores).map(Number)
      const productIngredients = await getProductIngredients(productIds);
      const filteredProducts = filterByBlocklist(productScores, blockedIngredients, productIngredients);
      console.log('Filtered products:', filteredProducts);

    // Step 5: Filter by budget
      const productDetails = await getProductDetails();
      const budgetFiltered = filterByBudget(filteredProducts, normalised, productDetails);

    // Step 6: Select top per category
      const topProducts = selectTopPerCategory(budgetFiltered, productDetails);
      console.log('Final recommendations:', topProducts);

      res.json({ recommendations: topProducts });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Recommendation generation failed' });
    }
  })()
});

export default router;
