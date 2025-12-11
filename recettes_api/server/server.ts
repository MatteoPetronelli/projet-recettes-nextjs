import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { getRecipesFromFile, saveRecipesToFile, Recipe } from './db';
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
    name
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
    user: { id: user.id, name: user.name, email: user.email } 
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
    console.log("⚡️ Réponse depuis le cache");
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
  cache.flushAll();

  const { id } = req.params;
  const userId = req.user!.id;
  
  try {
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

    const updatedRecipe = { 
      ...recipes[index], 
      ...req.body, 
      id: id, 
      authorId: userId
    };

    recipes[index] = updatedRecipe;

    await saveRecipesToFile(recipes);
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

app.listen(PORT, () => {
  console.log(`🚀 Serveur Express tourne sur http://localhost:${PORT}`);
});
