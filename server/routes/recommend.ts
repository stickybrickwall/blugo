import { Router, Response } from 'express';
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
import { formatQuizResponses } from '../utils/quizFormatter';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const router = Router();

const TAG_NAMES: Record<number, string> = {
  1: 'Dry skin',
  2: 'Oily skin',
  3: 'Sensitive skin',
  4: 'Clogged pores',
  5: 'Textured skin',
  6: 'Acne-prone skin',
  7: 'Hyperpigmentation',
  8: 'Dullness',
  9: 'Redness',
  10: 'Dehydrated skin',
  11: 'Damaged skin barrier',
  12: 'Aging'
};

router.post('/recommendations', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  console.log('Recommendations route hit');
  (async() => {
    const CATEGORY_MAP: Record<number, string> = {
    1: 'cleanser',
    2: 'toner',
    3: 'serum',
    4: 'moisturiser'
    };

    const ORDERED_CATEGORIES = ['cleanser', 'toner', 'serum', 'moisturiser'];

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
        filteredProducts = filterByBlocklist(budgetFiltered, blockedIngredients, productIngredients, true);
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
          console.warn(`Unmapped category ID ${catId} in results`);
        }
      }

      console.log('Final recommendations to frontend:', readableRecommendations);

    // Step 6: Send Top Tags and Ingredients
      const skinConcernScores = Object.entries(normalised)
        .filter(([tagId]) => SKIN_CONCERN_TAGS.has(+tagId))
        .map(([tagId, score]) => ({ tagId: +tagId, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0,6);

      const tagIngredientMap = await getTagIngredientMap();
      const ingredientScores = computeIngredientScores(tagIngredientMap, normalised);

      const unblockedIngredientScores = Object.entries(ingredientScores)
        .filter(([ingredientIdStr]) => !blockedIngredients.has(+ingredientIdStr))
        .sort((a, b) => b[1] - a[1])
        .slice(0,10)
        .map(([ingredientId, score]) => ({ ingredientId: +ingredientId, score }));

      const topIngredientIds = unblockedIngredientScores.map(i => i.ingredientId);
      const blockedIngredientIds = Array.from(blockedIngredients);

      const allUsedProductIngredientIds = Object.values(readableRecommendations)
        .flatMap(product => productIngredients[product.id] || []);

      const ingredientIds = topIngredientIds
        .concat(blockedIngredientIds)
        .concat(allUsedProductIngredientIds);

      const uniqueIngredientIds = Array.from(new Set(ingredientIds));

      const ingredientNameMap = await getIngredientNames(uniqueIngredientIds); // for all blocked and unblocked

      for (const [cat, product] of Object.entries(readableRecommendations)) {
        const pid = product.id;
        const ingredientIds = productIngredients[pid] || [];
        const unblocked = ingredientIds.filter(id => !blockedIngredients.has(id));
        const scoredUnblocked = unblocked
          .map(id => ({
            name: ingredientNameMap[id] || 'Unknown',
            score: ingredientScores[id] ?? 0  
          }))
          .sort((a, b) => b.score - a.score);
        product.unblocked_ingredients = scoredUnblocked;
      }

      const topIngredientsWithNames = unblockedIngredientScores.map(({ ingredientId, score }) => ({
        ingredientId,
        name: ingredientNameMap[ingredientId] || 'Unknown',
        score
      }));

      const blockedIngredientNames = blockedIngredientIds
        .map(id => ingredientNameMap[id])
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      
    //Step 7: Generate explanations from quiz responses

    // 7a: What This Says About Your Skin
      const { rows } = await pool.query(
        `SELECT responses FROM quiz_responses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      let skinConcernExplanation = '';
      if (rows.length > 0) {
        const responses = rows[0].responses;
        const formatted = formatQuizResponses(responses); // Import this from your utils

        const prompt = `
      A user answered a skincare quiz with the following inputs:
      ${formatted}
      All responses with a numerical value are selected from a range of 1 to 5. 
      Based on this, diagnose their skin type and generate a personalised skin profile using second-person language. Keep the paragraph succint, less than 100 words, and be insightful.
      `;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 300,
        });

        skinConcernExplanation = completion.choices[0].message.content || '';
      }
      
    // 7b: Why These Products?
    const topSkinConcernsFormatted = skinConcernScores
      .slice(0,4)
      .map(c => `${TAG_NAMES[c.tagId]} (${Math.round(c.score * 100)}%)`)
      .join(', ');

    const topIngredientsFormatted = topIngredientsWithNames
      .map(i => i.name)
      .join(', ');

    const orderedProductLines = ORDERED_CATEGORIES.map((category) => {
      const product = readableRecommendations[category];
      if (!product) return null;

      const ingredients = productIngredients[product.id] || [];
      const ingredientNames = ingredients.slice(0, 5).map(id => ingredientNameMap[id] || 'Unknown').join(', ');
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

      return `${categoryName} – ${product.name}: ${ingredientNames}`;
    }).filter(Boolean);

    const productExplanationPrompt = `
    You are a skincare expert. A user has the following skin concerns (by priority):
    ${topSkinConcernsFormatted}

    And the following top beneficial ingredients:
    ${topIngredientsFormatted}

    Below are the ingredient lists of 4 recommended products:
    ${orderedProductLines.join('\n')}

    These ingredient lists have been curated to show the most relevant ingredients for each product. 

    Write 4 short paragraphs (around 30-50 words each), one for each category, in the following order: cleanser, toner, serum, moisturiser. Each paragraph should start with "For [CategoryName],".
    Explain clearly and insightfully why the product was selected for the user. Connect each product's ingredients to the user's concerns. 
    Use second-person language. 
    `;

    let productExplanation = '';
    try {
      const explanationResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: productExplanationPrompt }],
        temperature: 0.7,
        max_tokens: 350
      });
      productExplanation = explanationResponse.choices[0].message.content || '';
    } catch (e) {
      console.error('Failed to generate product explanation:', e);
      productExplanation = 'Explanation unavailable at this time.';
    }

    // Step 7c: Ingredient Explanations
    let ingredientExplanation: Record<string, string> = {};

    try {
      const prompt = `
    You are a skincare expert. A user has the following top skin concerns: ${topSkinConcernsFormatted}.
    Explain in one sentence each how the following ingredients help with those concerns:

    ${topIngredientsFormatted}

    Return ONLY a valid JSON object, without extra comments or text. Make sure there is a comma after each entry.
    Format:
    {
      "IngredientName1": "short explanation...",
      "IngredientName2": "short explanation...",
      ...
    }
    Limit each explanation to 20 words or less.
    `;

      const explanationResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });

      const rawText = explanationResponse.choices[0].message.content || '';

      console.log('🧪 Raw ingredient explanation response:\n', rawText);

      const parsed = JSON.parse(rawText);

      const top10Names = topIngredientsWithNames.map(i => i.name.trim().toLowerCase());

      ingredientExplanation = Object.fromEntries(
        Object.entries(parsed)
          .map(([k, v]) => [k.trim().toLowerCase(), v])
          .filter(([k]) => top10Names.includes(k as string))
      );

      console.log('🔍 Final ingredientExplanation keys before save:', Object.keys(ingredientExplanation));

    } catch (e) {
      console.error('⚠️ Failed to generate ingredient explanations:', e);
      ingredientExplanation = {};
    }

    // Step 8: Save results
      await pool.query(`
        INSERT INTO user_recommendations (user_id, recommendations, skin_concerns, ingredients, blocked_ingredients, skin_concern_exp, product_exp, ingredient_exp, updated_at)
        VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7, $8::jsonb, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          recommendations = EXCLUDED.recommendations, 
          skin_concerns = EXCLUDED.skin_concerns,
          ingredients = EXCLUDED.ingredients,
          blocked_ingredients = EXCLUDED.blocked_ingredients,
          skin_concern_exp = EXCLUDED.skin_concern_exp,
          product_exp = EXCLUDED.product_exp,
          ingredient_exp = EXCLUDED.ingredient_exp,
          updated_at = NOW();
      `, [
          userId, 
          JSON.stringify(readableRecommendations),
          JSON.stringify(skinConcernScores),
          JSON.stringify(topIngredientsWithNames),
          JSON.stringify(blockedIngredientNames),
          skinConcernExplanation,
          productExplanation,
          ingredientExplanation,
        ]);

      res.json({ 
        recommendations: readableRecommendations,
        topSkinConcerns: skinConcernScores,
        topIngredients: topIngredientsWithNames,
        blockedIngredients: blockedIngredientNames,
        skinConcernExplanation,
        productExplanation,
        ingredientExplanation,
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
        blocked_ingredients AS "blockedIngredients",
        skin_concern_exp AS "skinConcernExplanation",
        product_exp AS "productExplanation",
        ingredient_exp AS "ingredientExplanation",
        updated_at AS "latestResponse"
      FROM user_recommendations
      WHERE user_id = $1
    `, [userId]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'No recommendations found' });
      return;
    }

    const { recommendations, topSkinConcerns, topIngredients, blockedIngredients, skinConcernExplanation, productExplanation, ingredientExplanation, latestResponse } = rows[0];

    console.log('🧪 Raw ingredientExplanation from DB:', ingredientExplanation);

    let normalizedIngredientExplanation: Record<string, string> = {};

    if (typeof ingredientExplanation === 'string') {
      try {
        normalizedIngredientExplanation = JSON.parse(ingredientExplanation);
      } catch {
        console.error('⚠️ Failed to parse stringified ingredientExplanation');
      }
    } else if (
      ingredientExplanation &&
      typeof ingredientExplanation === 'object' &&
      !Array.isArray(ingredientExplanation)
    ) {
      normalizedIngredientExplanation = ingredientExplanation as Record<string, string>;
    }

    console.log('✅ Normalized IngredientExp sent:', normalizedIngredientExplanation);

    res.json({ recommendations, topSkinConcerns, topIngredients, blockedIngredients, skinConcernExplanation, productExplanation, ingredientExplanation: normalizedIngredientExplanation, latestResponse });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch past recommendations' });
  }
});

export default router;
