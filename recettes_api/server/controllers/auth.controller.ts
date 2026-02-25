import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { getUsersFromFile, saveUsersToFile, findUserByEmail, User } from '../user.db';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const JWT_SECRET = process.env.JWT_SECRET!;

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
  } catch (error) {
    next(error);
  }
};