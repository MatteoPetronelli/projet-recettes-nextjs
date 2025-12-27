import fs from 'fs/promises';
import path from 'path';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  favorites: string[];
}

const dbPath = path.join(__dirname, 'data', 'users.json');

export async function getUsersFromFile(): Promise<User[]> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function saveUsersToFile(users: User[]): Promise<void> {
  await fs.writeFile(dbPath, JSON.stringify(users, null, 2), 'utf-8');
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsersFromFile();
  return users.find(u => u.email === email);
}
