import { z } from 'zod';


export const RecipeSchema = z.object({
  name: z.string().min(3, "Le nom doit faire au moins 3 caractères"),
  imageUrl: z.string()
    .url("L'URL est invalide")
    .startsWith("https://", "L'image doit être sécurisée (HTTPS)")
    .refine((url) => {
      if (!url) return true;
      
      const cleanUrl = url.split('?')[0].toLowerCase();
      const hasImageExt = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(cleanUrl);
      
      const isUnsplashPhoto = url.includes("images.unsplash.com/photo-");

      return hasImageExt || isUnsplashPhoto;
    }, { 
      message: "L'URL doit être une image directe (.jpg, .png) ou un lien Unsplash valide." 
    })
    .or(z.literal("")),
  country: z.string().min(2, "Le pays est requis"),
  type: z.enum(["Entrée", "Plat", "Dessert"] as const, {
    message: "Le type doit être Entrée, Plat ou Dessert",
  }),
  diet: z.string(),
  ingredients: z.array(z.string()).min(1, "Il faut au moins 1 ingrédient"),
  steps: z.array(z.string()).min(1, "Il faut au moins 1 étape"),
  time: z.number().min(1, "Le temps doit être positif").max(1440, "Moins de 24h quand même !"),
  difficulty: z.number().min(1).max(5, "La difficulté doit être entre 1 et 5"),
  visibility: z.enum(['public', 'private'], {
    message: "La visibilité doit être 'public' ou 'private'"
  }),
  authorId: z.string().optional(),
});
