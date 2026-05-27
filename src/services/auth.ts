import { db, hashPassword, verifyPassword } from './database';
import { Profile } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@prodsuivi_auth';

// Sign up new user
export async function signUp(
  nom: string,
  telephone: string,
  email: string,
  password: string
): Promise<Profile> {
  try {
    const passwordHash = hashPassword(password);
    const result = db.runSync(
      `INSERT INTO profiles (nom, telephone, email, password_hash) 
       VALUES (?, ?, ?, ?)`,
      [nom, telephone, email, passwordHash]
    );

    const user = db.getFirstSync(
      'SELECT * FROM profiles WHERE id = ?',
      [result.lastInsertRowId]
    ) as Profile;

    return user;
  } catch (error) {
    throw new Error('Error during sign up: ' + String(error));
  }
}

// Sign in user
export async function signIn(email: string, password: string): Promise<Profile> {
  try {
    const user = db.getFirstSync(
      'SELECT * FROM profiles WHERE email = ?',
      [email]
    ) as Profile | undefined;

    if (!user) {
      throw new Error('User not found');
    }

    if (!verifyPassword(password, user.password_hash)) {
      throw new Error('Invalid password');
    }

    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    throw new Error('Error during sign in: ' + String(error));
  }
}

// Get current user from storage
export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const userJson = await AsyncStorage.getItem(AUTH_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Sign out user
export async function signOut(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error('Error during sign out:', error);
  }
}
