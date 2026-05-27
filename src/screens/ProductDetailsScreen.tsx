import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import {
  getProductById,
  getProductEntries,
  createProductEntry,
  deleteProductEntry,
} from '../services/container';
import { Product, ProductEntry } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export function ProductDetailsScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [entries, setEntries] = useState<ProductEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [entryForm, setEntryForm] = useState({
    qte: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = () => {
    setLoading(true);
    try {
      const prod = getProductById(productId);
      if (prod) {
        setProduct(prod);
        const prods = getProductEntries(productId);
        setEntries(prods);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    if (!entryForm.qte) {
      Alert.alert('Erreur', 'Veuillez entrer une quantité');
      return;
    }

    try {
      const now = new Date().toISOString();
      createProductEntry(productId, parseInt(entryForm.qte), now);
      setEntryForm({ qte: '' });
      setModalVisible(false);
      loadData();
      Alert.alert('Succès', 'Ajout enregistré');
    } catch (error) {
      Alert.alert('Erreur', String(error));
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text>Produit non trouvé</Text>
      </View>
    );
  }

  const totalCartons = entries.reduce((sum, e) => sum + e.qte_ajoutee, 0);
  const totalWeight = totalCartons * product.poids_carton_kg;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{product.nom}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Poids pièce</Text>
            <Text style={styles.infoValue}>{product.poids_piece_kg} kg</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Pcs/carton</Text>
            <Text style={styles.infoValue}>{product.qte_par_carton}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Poids carton</Text>
            <Text style={styles.infoValue}>{product.poids_carton_kg} kg</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cartons totaux</Text>
            <Text style={styles.statValue}>{totalCartons}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Poids total</Text>
            <Text style={styles.statValue}>{totalWeight.toFixed(1)} kg</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ajouts</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {entries.length === 0 ? (
            <Text style={styles.emptyText}>Aucun ajout</Text>
          ) : (
            <FlatList
              data={entries}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.entryCard}>
                  <View>
                    <Text style={styles.entryQty}>
                      {item.qte_ajoutee} carton{item.qte_ajoutee > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.entryDate}>
                      {new Date(item.date_heure).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(item.date_heure).toLocaleTimeString('fr-FR')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Supprimer', 'Supprimer cet ajout ?', [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Supprimer',
                          style: 'destructive',
                          onPress: () => {
                            deleteProductEntry(item.id);
                            loadData();
                          },
                        },
                      ]);
                    }}
                  >
                    <Text style={styles.deleteButton}>🗑</Text>
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter Cartons</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de cartons"
              keyboardType="number-pad"
              value={entryForm.qte}
              onChangeText={(text) => setEntryForm({ qte: text })}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleAddEntry}
              >
                <Text style={styles.submitButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 15,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
    opacity: 0.9,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryQty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  deleteButton: {
    fontSize: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3498db',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
