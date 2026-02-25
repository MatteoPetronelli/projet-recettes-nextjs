import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRecipe } from '../middlewares/validate.middleware';
import { 
  getAllRecipes, 
  getRecipeById, 
  createRecipe, 
  updateRecipe, 
  deleteRecipe, 
  toggleFavorite, 
  addReview, 
  updateReview, 
  deleteReview 
} from '../controllers/recipe.controller';

const router = Router();

router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.post('/', validateRecipe, requireAuth, createRecipe);
router.put('/:id', validateRecipe, requireAuth, updateRecipe);
router.delete('/:id', requireAuth, deleteRecipe);
router.post('/:id/favorite', requireAuth, toggleFavorite);
router.post('/:id/reviews', requireAuth, addReview);
router.put('/:id/reviews', requireAuth, updateReview);
router.delete('/:id/reviews', requireAuth, deleteReview);

export default router;