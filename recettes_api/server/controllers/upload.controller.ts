import { Request, Response, NextFunction } from 'express';

export const uploadImage = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Aucun fichier envoyé" });
      return;
    }
    
    const fileUrl = `http://127.0.0.1:4000/uploads/${req.file.filename}`;
    res.json({ imageUrl: fileUrl });
  } catch (error) {
    next(error);
  }
};