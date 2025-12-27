export interface Review {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  reviews: Review[];
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