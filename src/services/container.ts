import { db } from './database';
import { Container, Product, ProductEntry } from '../types';

// Get all containers for user
export function getUserContainers(userId: number): Container[] {
  try {
    const containers = db.getAllSync(
      'SELECT * FROM containers WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    ) as Container[];
    return containers;
  } catch (error) {
    console.error('Error getting containers:', error);
    return [];
  }
}

// Get container by id
export function getContainerById(containerId: number): Container | null {
  try {
    const container = db.getFirstSync(
      'SELECT * FROM containers WHERE id = ?',
      [containerId]
    ) as Container | undefined;
    return container || null;
  } catch (error) {
    console.error('Error getting container:', error);
    return null;
  }
}

// Create container
export function createContainer(userId: number, nom: string): Container {
  try {
    const result = db.runSync(
      `INSERT INTO containers (user_id, nom, statut) 
       VALUES (?, ?, ?)`,
      [userId, nom, 'ouvert']
    );

    const container = db.getFirstSync(
      'SELECT * FROM containers WHERE id = ?',
      [result.lastInsertRowId]
    ) as Container;

    return container;
  } catch (error) {
    throw new Error('Error creating container: ' + String(error));
  }
}

// Update container status
export function updateContainerStatus(
  containerId: number,
  statut: 'ouvert' | 'cloture'
): void {
  try {
    db.runSync(
      `UPDATE containers SET statut = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [statut, containerId]
    );
  } catch (error) {
    throw new Error('Error updating container: ' + String(error));
  }
}

// Delete container
export function deleteContainer(containerId: number): void {
  try {
    db.runSync('DELETE FROM containers WHERE id = ?', [containerId]);
  } catch (error) {
    throw new Error('Error deleting container: ' + String(error));
  }
}

// Get container products
export function getContainerProducts(containerId: number): Product[] {
  try {
    const products = db.getAllSync(
      'SELECT * FROM products WHERE container_id = ? ORDER BY created_at DESC',
      [containerId]
    ) as Product[];
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

// Get product by id
export function getProductById(productId: number): Product | null {
  try {
    const product = db.getFirstSync(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    ) as Product | undefined;
    return product || null;
  } catch (error) {
    console.error('Error getting product:', error);
    return null;
  }
}

// Create product
export function createProduct(
  containerId: number,
  nom: string,
  poids_piece_kg: number,
  qte_par_carton: number,
  poids_carton_kg: number
): Product {
  try {
    const result = db.runSync(
      `INSERT INTO products (container_id, nom, poids_piece_kg, qte_par_carton, poids_carton_kg) 
       VALUES (?, ?, ?, ?, ?)`,
      [containerId, nom, poids_piece_kg, qte_par_carton, poids_carton_kg]
    );

    const product = db.getFirstSync(
      'SELECT * FROM products WHERE id = ?',
      [result.lastInsertRowId]
    ) as Product;

    return product;
  } catch (error) {
    throw new Error('Error creating product: ' + String(error));
  }
}

// Update product
export function updateProduct(
  productId: number,
  nom: string,
  poids_piece_kg: number,
  qte_par_carton: number,
  poids_carton_kg: number
): void {
  try {
    db.runSync(
      `UPDATE products SET nom = ?, poids_piece_kg = ?, qte_par_carton = ?, poids_carton_kg = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [nom, poids_piece_kg, qte_par_carton, poids_carton_kg, productId]
    );
  } catch (error) {
    throw new Error('Error updating product: ' + String(error));
  }
}

// Delete product
export function deleteProduct(productId: number): void {
  try {
    db.runSync('DELETE FROM products WHERE id = ?', [productId]);
  } catch (error) {
    throw new Error('Error deleting product: ' + String(error));
  }
}

// Get product entries
export function getProductEntries(productId: number): ProductEntry[] {
  try {
    const entries = db.getAllSync(
      'SELECT * FROM product_entries WHERE product_id = ? ORDER BY date_heure DESC',
      [productId]
    ) as ProductEntry[];
    return entries;
  } catch (error) {
    console.error('Error getting product entries:', error);
    return [];
  }
}

// Create product entry
export function createProductEntry(
  productId: number,
  qte_ajoutee: number,
  date_heure: string
): ProductEntry {
  try {
    const result = db.runSync(
      `INSERT INTO product_entries (product_id, qte_ajoutee, date_heure) 
       VALUES (?, ?, ?)`,
      [productId, qte_ajoutee, date_heure]
    );

    const entry = db.getFirstSync(
      'SELECT * FROM product_entries WHERE id = ?',
      [result.lastInsertRowId]
    ) as ProductEntry;

    return entry;
  } catch (error) {
    throw new Error('Error creating product entry: ' + String(error));
  }
}

// Update product entry
export function updateProductEntry(
  entryId: number,
  qte_ajoutee: number,
  date_heure: string
): void {
  try {
    db.runSync(
      `UPDATE product_entries SET qte_ajoutee = ?, date_heure = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [qte_ajoutee, date_heure, entryId]
    );
  } catch (error) {
    throw new Error('Error updating product entry: ' + String(error));
  }
}

// Delete product entry
export function deleteProductEntry(entryId: number): void {
  try {
    db.runSync('DELETE FROM product_entries WHERE id = ?', [entryId]);
  } catch (error) {
    throw new Error('Error deleting product entry: ' + String(error));
  }
}

// Calculate statistics for user
export function getUserStatistics(userId: number) {
  try {
    // Get all containers for user
    const containers = getUserContainers(userId);
    const containerIds = containers.map((c) => c.id);

    if (containerIds.length === 0) {
      return {
        totalContainers: 0,
        totalCartons: 0,
        totalTonnage: 0,
      };
    }

    // Get all products for containers
    let totalCartons = 0;
    let totalTonnage = 0;

    for (const containerId of containerIds) {
      const products = getContainerProducts(containerId);
      for (const product of products) {
        const entries = getProductEntries(product.id);
        const cartonCount = entries.reduce((sum, e) => sum + e.qte_ajoutee, 0);
        totalCartons += cartonCount;
        totalTonnage += cartonCount * product.poids_carton_kg;
      }
    }

    return {
      totalContainers: containers.length,
      totalCartons,
      totalTonnage,
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return {
      totalContainers: 0,
      totalCartons: 0,
      totalTonnage: 0,
    };
  }
}
