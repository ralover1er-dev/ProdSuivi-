import * as SQLite from 'expo-sqlite';
import CryptoJS from 'crypto-js';

const dbName = 'prodsuivi.db';

export const db = SQLite.openDatabaseSync(dbName);

// Initialize database and create tables
export async function initializeDatabase() {
  try {
    // Create profiles table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        telephone TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create containers table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS containers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        nom TEXT NOT NULL,
        statut TEXT NOT NULL CHECK(statut IN ('ouvert', 'cloture')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      );
    `);

    // Create products table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        container_id INTEGER NOT NULL,
        nom TEXT NOT NULL,
        poids_piece_kg REAL NOT NULL,
        qte_par_carton INTEGER NOT NULL,
        poids_carton_kg REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE
      );
    `);

    // Create product_entries table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS product_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        qte_ajoutee INTEGER NOT NULL,
        date_heure DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // Check if we need to seed data
    await seedInitialData();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Seed initial data on first launch
async function seedInitialData() {
  try {
    // Check if profiles table is empty
    const result = db.getFirstSync('SELECT COUNT(*) as count FROM profiles') as { count: number };
    
    if (result && result.count === 0) {
      // Create default user
      const defaultPassword = CryptoJS.SHA256('demo123').toString();
      const userResult = db.runSync(
        `INSERT INTO profiles (nom, telephone, email, password_hash) 
         VALUES (?, ?, ?, ?)`,
        ['Demo User', '+33612345678', 'demo@prodsuivi.com', defaultPassword]
      );
      
      const userId = userResult.lastInsertRowId;

      // Create default container
      const containerResult = db.runSync(
        `INSERT INTO containers (user_id, nom, statut) 
         VALUES (?, ?, ?)`,
        [userId, 'COMACAM SUARL', 'ouvert']
      );

      const containerId = containerResult.lastInsertRowId;

      // Create default products
      const products = [
        { nom: 'Ndole', poids_piece: 0.5, qte_carton: 20, poids_carton: 12 },
        { nom: 'Pondu', poids_piece: 0.4, qte_carton: 25, poids_carton: 11 },
        { nom: 'Bitter leaves', poids_piece: 0.3, qte_carton: 30, poids_carton: 10 }
      ];

      for (const product of products) {
        const productResult = db.runSync(
          `INSERT INTO products (container_id, nom, poids_piece_kg, qte_par_carton, poids_carton_kg) 
           VALUES (?, ?, ?, ?, ?)`,
          [containerId, product.nom, product.poids_piece, product.qte_carton, product.poids_carton]
        );

        // Add some initial entries for demo
        const productId = productResult.lastInsertRowId;
        const now = new Date().toISOString();
        db.runSync(
          `INSERT INTO product_entries (product_id, qte_ajoutee, date_heure) 
           VALUES (?, ?, ?)`,
          [productId, 5, now]
        );
      }

      console.log('Initial data seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

// Hash password
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
