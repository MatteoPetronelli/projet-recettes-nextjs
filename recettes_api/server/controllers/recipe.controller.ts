import { Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { getRecipesFromFile, saveRecipesToFile, Recipe, Review } from '../db';
import { getUsersFromFile, saveUsersToFile } from '../user.db';
import { AuthRequest } from '../middlewares/auth.middleware';
import cache from '../cache';

const deleteLocalImage = (imageUrl: string) => {
  if (!imageUrl || !imageUrl.includes('/uploads/')) return;
  
  try {
    const filename = imageUrl.split('/uploads/')[1];
    if (filename) {
      const filePath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

export const getAllRecipes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    const type = req.query.type as string;
    const user = req.user;

    const cacheKey = `recettes_${user ? user.id : 'anon'}_${query || ''}_${type || ''}`;

    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      res.json(cachedData);
      return;
    }

    let recipes = await getRecipesFromFile();

    recipes = recipes.filter(recipe => {
      if (recipe.visibility === 'public') return true;
      if (user && recipe.authorId === user.id) return true;
      return false;
    });

    if (query) {
      const lowerQuery = query.toLowerCase();
      recipes = recipes.filter((r) =>
        r.name.toLowerCase().includes(lowerQuery) ||
        r.country.toLowerCase().includes(lowerQuery) ||
        r.ingredients.some((ing) => ing.toLowerCase().includes(lowerQuery))
      );
    }

    if (type) {
      recipes = recipes.filter((r) => r.type.toLowerCase() === type.toLowerCase());
    }

    cache.set(cacheKey, recipes);
    res.json(recipes);
  } catch (error) {
    next(error);
  }
};

export const getRecipeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const recipes = await getRecipesFromFile();
    const recipe = recipes.find((r) => r.id === id);

    if (!recipe) {
      res.status(404).json({ message: "Recette non trouvée" });
      return;
    }

    if (recipe.visibility === 'private' && (!user || recipe.authorId !== user.id)) {
      res.status(403).json({ message: "Cette recette est privée." });
      return;
    }

    res.json(recipe);
  } catch (error) {
    next(error);
  }
};

export const createRecipe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    cache.flushAll();
    const body = req.body;
    const currentRecipes = await getRecipesFromFile();

    const newRecipe: Recipe = {
      id: randomUUID(),
      ...body,
      authorId: req.user!.id, 
      rating: 0,
      createdAt: new Date().toISOString(),
    };

    currentRecipes.push(newRecipe);
    await saveRecipesToFile(currentRecipes);

    res.status(201).json(newRecipe);
  } catch (error) {
    next(error);
  }
};

export const updateRecipe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const recipes = await getRecipesFromFile();
    const index = recipes.findIndex((r) => r.id === id);

    if (index === -1) { 
      res.status(404).json({ message: "Recette non trouvée" }); 
      return; 
    }

    if (recipes[index].authorId !== userId) {
      res.status(403).json({ message: "Vous ne pouvez modifier que vos propres recettes." });
      return;
    }

    const oldImageUrl = recipes[index].imageUrl;
    const newImageUrl = req.body.imageUrl;

    if (oldImageUrl !== newImageUrl) {
      deleteLocalImage(oldImageUrl);
    }

    const oldVisibility = recipes[index].visibility;
    const newVisibility = req.body.visibility;

    let updatedReviews = recipes[index].reviews || [];
    let updatedRating = recipes[index].rating;

    if (oldVisibility === 'public' && newVisibility === 'private') {
        updatedReviews = [];
        updatedRating = 0;
    }

    const updatedRecipe = { 
      ...recipes[index], 
      ...req.body, 
      id: id, 
      authorId: userId,
      reviews: updatedReviews,
      rating: updatedRating
    };

    recipes[index] = updatedRecipe;
    await saveRecipesToFile(recipes);
    cache.flushAll();

    res.json(updatedRecipe);
  } catch (error) {
    next(error);
  }
};

export const deleteRecipe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    cache.flushAll();
    const { id } = req.params;
    const userId = req.user!.id;

    let recipes = await getRecipesFromFile();
    const recipe = recipes.find((r) => r.id === id);
    
    if (!recipe) {
       res.status(404).json({ message: "Recette non trouvée" });
       return;
    }

    if (recipe.authorId !== userId) {
      res.status(403).json({ message: "Interdit ! Ce n'est pas votre recette." });
      return;
    }

    deleteLocalImage(recipe.imageUrl);

    recipes = recipes.filter((r) => r.id !== id);
    await saveRecipesToFile(recipes);

    res.json({ message: "Supprimé avec succès" });
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user!.id;

    const users = await getUsersFromFile();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }

    const user = users[userIndex];
    if (!user.favorites) user.favorites = [];

    const favIndex = user.favorites.indexOf(recipeId);

    if (favIndex === -1) {
      user.favorites.push(recipeId);
    } else {
      user.favorites.splice(favIndex, 1);
    }

    users[userIndex] = user;
    await saveUsersToFile(users);

    res.json({ favorites: user.favorites });
  } catch (error) {
    next(error);
  }
};

export const addReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user!;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Note invalide" });
      return;
    }

    const recipes = await getRecipesFromFile();
    const index = recipes.findIndex((r) => r.id === id);

    if (index === -1) {
        res.status(404).json({ message: "Recette introuvable" });
        return;
    }

    const recipe = recipes[index];

    if (recipe.visibility === 'private') {
        res.status(403).json({ message: "Impossible de commenter une recette privée." });
        return;
    }

    if (!recipe.reviews) recipe.reviews = [];

    const existingReviewIndex = recipe.reviews.findIndex(r => r.userId === user.id);
    if (existingReviewIndex !== -1) {
        res.status(400).json({ message: "Vous avez déjà noté cette recette. Modifiez votre avis existant." });
        return;
    }

    const newReview: Review = {
      userId: user.id,
      userName: user.name,
      rating: Number(rating),
      comment: comment,
      createdAt: new Date().toISOString()
    };

    recipe.reviews.push(newReview);

    const totalStars = recipe.reviews.reduce((acc, r) => acc + r.rating, 0);
    recipe.rating = parseFloat((totalStars / recipe.reviews.length).toFixed(1));

    recipes[index] = recipe;
    await saveRecipesToFile(recipes);
    cache.flushAll();

    res.status(201).json(newReview);
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user!;

    const recipes = await getRecipesFromFile();
    const index = recipes.findIndex((r) => r.id === id);
    if (index === -1) { 
      res.status(404).json({ message: "Recette introuvable" }); 
      return; 
    }

    const recipe = recipes[index];
    if (!recipe.reviews) recipe.reviews = [];

    const reviewIndex = recipe.reviews.findIndex(r => r.userId === user.id);

    if (reviewIndex === -1) {
        res.status(404).json({ message: "Avis non trouvé" });
        return;
    }

    recipe.reviews[reviewIndex].rating = Number(rating);
    recipe.reviews[reviewIndex].comment = comment;
    recipe.reviews[reviewIndex].createdAt = new Date().toISOString(); 

    const totalStars = recipe.reviews.reduce((acc, r) => acc + r.rating, 0);
    recipe.rating = parseFloat((totalStars / recipe.reviews.length).toFixed(1));

    recipes[index] = recipe;
    await saveRecipesToFile(recipes);
    cache.flushAll();

    res.json(recipe.reviews[reviewIndex]);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const recipes = await getRecipesFromFile();
    const index = recipes.findIndex((r) => r.id === id);
    if (index === -1) { 
      res.status(404).json({ message: "Recette introuvable" }); 
      return; 
    }

    const recipe = recipes[index];
    if (!recipe.reviews) { 
      res.status(404).json({ message: "Aucun avis" }); 
      return; 
    }

    const initialLength = recipe.reviews.length;
    recipe.reviews = recipe.reviews.filter(r => r.userId !== user.id);

    if (recipe.reviews.length === initialLength) {
        res.status(404).json({ message: "Avis non trouvé" });
        return;
    }

    if (recipe.reviews.length > 0) {
        const totalStars = recipe.reviews.reduce((acc, r) => acc + r.rating, 0);
        recipe.rating = parseFloat((totalStars / recipe.reviews.length).toFixed(1));
    } else {
        recipe.rating = 0;
    }

    recipes[index] = recipe;
    await saveRecipesToFile(recipes);
    cache.flushAll();

    res.json({ message: "Avis supprimé" });
  } catch (error) {
    next(error);
  }
};