import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { getRecipesFromFile, saveRecipesToFile, Recipe, Review } from './db';
import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { RecipeSchema } from './schemas/recipe.schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUsersFromFile, saveUsersToFile, findUserByEmail, User } from './user.db';
import { authMiddleware, requireAuth, AuthRequest } from './auth.middleware';
import cache from './cache';

const validateRecipe = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    RecipeSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ 
        message: "Données invalides", 
        errors: error.issues.map(e => ({ field: e.path[0], message: e.message })) 
      });
    } else {
      res.status(500).json({ message: "Erreur interne de validation" });
    }
  }
};

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ==========================================
// ROUTES D'AUTHENTIFICATION (Publiques)
// ==========================================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ message: "Tous les champs sont requis" });
    return;
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    res.status(400).json({ message: "Cet email est déjà utilisé" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser: User = {
    id: randomUUID(),
    email,
    passwordHash: hashedPassword,
    name,
    favorites: []
  };

  const users = await getUsersFromFile();
  users.push(newUser);
  await saveUsersToFile(users);

  res.status(201).json({ message: "Compte créé avec succès !" });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    res.status(400).json({ message: "Email ou mot de passe incorrect" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(400).json({ message: "Email ou mot de passe incorrect" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );

  res.json({ 
    token, 
    user: { id: user.id, name: user.name, email: user.email, favorites: user.favorites || [] } 
  });
});

// ==========================================
// ROUTES RECETTES (Sécurisées)
// ==========================================

app.use('/api/recettes', authMiddleware);

app.get('/api/recettes', async (req: AuthRequest, res: Response) => {
  const query = req.query.q as string;
  const type = req.query.type as string;
  const user = req.user;

  const cacheKey = `recettes_${user ? user.id : 'anon'}_${query || ''}_${type || ''}`;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
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
});

app.get('/api/recettes/:id', async (req: AuthRequest, res: Response) => {
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
});

app.post('/api/recettes', validateRecipe, requireAuth, async (req: AuthRequest, res: Response) => {
  cache.flushAll();

  try {
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
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.put('/api/recettes/:id', validateRecipe, requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  
  try {
    const recipes = await getRecipesFromFile();
    const index = recipes.findIndex((r) => r.id === id);

    if (index === -1) { res.status(404).json({ message: "Recette non trouvée" }); return; }

    if (recipes[index].authorId !== userId) {
      res.status(403).json({ message: "Vous ne pouvez modifier que vos propres recettes." });
      return;
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
    cache.flushAll(); // Important !

    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.delete('/api/recettes/:id', requireAuth, async (req: AuthRequest, res: Response) => {
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

  recipes = recipes.filter((r) => r.id !== id);
  await saveRecipesToFile(recipes);

  res.json({ message: "Supprimé avec succès" });
});

app.post('/api/recettes/:id/favorite', requireAuth, async (req: AuthRequest, res: Response) => {
  const recipeId = req.params.id;
  const userId = req.user!.id;

  try {
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
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post('/api/recettes/:id/reviews', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const user = req.user!;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ message: "Note invalide" });
    return;
  }

  try {
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
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.put('/api/recettes/:id/reviews', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const user = req.user!;

  try {
    const recipes = await getRecipesFromFile();
    const index = recipes.findIndex((r) => r.id === id);
    if (index === -1) { res.status(404).json({ message: "Recette introuvable" }); return; }

    const recipe = recipes[index];
    if (!recipe.reviews) recipe.reviews = [];

    const reviewIndex = recipe.reviews.findIndex(r => r.userId === user.id);

    if (reviewIndex === -1) {
        res.status(404).json({ message: "Avis non trouvé" });
        return;
    }

    recipe.reviews[reviewIndex].rating = Number(rating);
    recipe.reviews[reviewIndex].comment = comment;
    recipe.reviews[reviewIndex].createdAt = new Date().toISOString(); // On met à jour la date

    const totalStars = recipe.reviews.reduce((acc, r) => acc + r.rating, 0);
    recipe.rating = parseFloat((totalStars / recipe.reviews.length).toFixed(1));

    recipes[index] = recipe;
    await saveRecipesToFile(recipes);
    cache.flushAll();

    res.json(recipe.reviews[reviewIndex]);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.delete('/api/recettes/:id/reviews', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  try {
    const recipes = await getRecipesFromFile();
    const index = recipes.findIndex((r) => r.id === id);
    if (index === -1) { res.status(404).json({ message: "Recette introuvable" }); return; }

    const recipe = recipes[index];
    if (!recipe.reviews) { res.status(404).json({ message: "Aucun avis" }); return; }

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
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Express tourne sur http://localhost:${PORT}`);
});
