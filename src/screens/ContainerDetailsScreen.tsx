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
  getContainerById,
  getContainerProducts,
  updateContainerStatus,
  deleteContainer,
  createProduct,
} from '../services/container';
import { Container, Product } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export function ContainerDetailsScreen({ route, navigation }: any) {
  const { containerId } = route.params;
  const [container, setContainer] = useState<Container | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [productForm, setProductForm] = useState({
    nom: '',
    poids_piece_kg: '',
    qte_par_carton: '',
    poids_carton_kg: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = () => {
    setLoading(true);
    try {
      const cont = getContainerById(containerId);
      if (cont) {
        setContainer(cont);
        const prods = getContainerProducts(containerId);
        setProducts(prods);
      }
    } catch (error) {
      console.error('Error loading container:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseContainer = () => {
    Alert.alert(
      'Clôturer',
      'Êtes-vous sûr de vouloir clôturer ce conteneur ?',
      [
        { text: 'Annuler', onPress: () => {}, style: 'cancel' },
        {
          text: 'Clôturer',
          onPress: () => {
            updateContainerStatus(containerId, 'cloture');
            loadData();
            Alert.alert('Succès', 'Conteneur clôturé');
          },
        },
      ]
    );
  };

  const handleAddProduct = () => {
    if (
      !productForm.nom ||
      !productForm.poids_piece_kg ||
      !productForm.qte_par_carton ||
      !productForm.poids_carton_kg
    ) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      createProduct(
        containerId,
        productForm.nom,
        parseFloat(productForm.poids_piece_kg),
        parseInt(productForm.qte_par_carton),
        parseFloat(productForm.poids_carton_kg)
      );
      setProductForm({ nom: '', poids_piece_kg: '', qte_par_carton: '', poids_carton_kg: '' });
      setModalVisible(false);
      loadData();
      Alert.alert('Succès', 'Produit créé');
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

  if (!container) {
    return (
      <View style={styles.centerContainer}>
        <Text>Conteneur non trouvé</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{container.nom}</Text>
          <View
            style={[
              styles.statusBadge,
              container.statut === 'ouvert'
                ? styles.statusOpen
                : styles.statusClosed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                container.statut === 'ouvert'
                  ? styles.statusOpenText
                  : styles.statusClosedText,
              ]}
            >
              {container.statut === 'ouvert' ? '📂 Ouvert' : '📁 Clôturé'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {container.statut === 'ouvert' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={handleCloseContainer}
            >
              <Text style={styles.actionButtonText}>Clôturer</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.downloadButton]}
            onPress={() => Alert.alert('Info', 'Export PDF non disponible en démo')}
          >
            <Text style={styles.actionButtonText}>📥 PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produits</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {products.length === 0 ? (
            <Text style={styles.emptyText}>Aucun produit</Text>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() =>
                    navigation.navigate('ProductDetails', {
                      productId: item.id,
                    })
                  }
                >
                  <View>
                    <Text style={styles.productName}>{item.nom}</Text>
                    <Text style={styles.productInfo}>
                      Poids pièce: {item.poids_piece_kg}kg
                    </Text>
                    <Text style={styles.productInfo}>
                      Pcs/carton: {item.qte_par_carton}
                    </Text>
                    <Text style={styles.productInfo}>
                      Poids carton: {item.poids_carton_kg}kg
                    </Text>
                  </View>
                </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Ajouter Produit</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Ndole, Pondu, Bitter leaves"
              value={productForm.nom}
              onChangeText={(text) =>
                setProductForm({ ...productForm, nom: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Poids pièce (kg)"
              keyboardType="decimal-pad"
              value={productForm.poids_piece_kg}
              onChangeText={(text) =>
                setProductForm({ ...productForm, poids_piece_kg: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Qté par carton"
              keyboardType="number-pad"
              value={productForm.qte_par_carton}
              onChangeText={(text) =>
                setProductForm({ ...productForm, qte_par_carton: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Poids carton (kg)"
              keyboardType="decimal-pad"
              value={productForm.poids_carton_kg}
              onChangeText={(text) =>
                setProductForm({ ...productForm, poids_carton_kg: text })
              }
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
                onPress={handleAddProduct}
              >
                <Text style={styles.submitButtonText}>Créer</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: '#d5f4e6',
  },
  statusClosed: {
    backgroundColor: '#fadbd8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusOpenText: {
    color: '#27ae60',
  },
  statusClosedText: {
    color: '#e74c3c',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
  },
  downloadButton: {
    backgroundColor: '#3498db',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  productInfo: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
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
    marginBottom: 15,
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
