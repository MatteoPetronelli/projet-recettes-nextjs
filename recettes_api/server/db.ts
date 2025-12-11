import fs from 'fs/promises';
import path from 'path';

export interface Recipe {
  id: string;
  name: string;
  imageUrl: string;
  country: string;
  type: string;
  diet: string;
  ingredients: string[];
  steps: string[];
  time: number;
  difficulty: number;
  authorId: string;
  visibility: 'public' | 'private';
  rating: number;
  createdAt: string;
}

const dbPath = path.join(__dirname, 'data', 'recipes.json');

export async function getRecipesFromFile(): Promise<Recipe[]> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function saveRecipesToFile(recipes: Recipe[]): Promise<void> {
  await fs.writeFile(dbPath, JSON.stringify(recipes, null, 2), 'utf-8');
}
