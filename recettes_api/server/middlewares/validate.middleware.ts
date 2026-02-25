import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { RecipeSchema } from '../schemas/recipe.schema';

export const validateRecipe = (req: Request, res: Response, next: NextFunction) => {
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