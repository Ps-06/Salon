import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api, Order } from '../services/api';
import OrderCard from '../components/OrderCard';
import { THEME, ORDER_STATUSES, STATUS_COLORS } from '../constants/parlour';

const FILTERS = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];
const PAGE_SIZE = 15;

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Status Change Modal State
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async (isRefresh = false, searchOverride?: string) => {
    try {
      if (isRefresh) {
        setPage(0);
        setHasMore(true);
      }
      
      const currentPage = isRefresh ? 0 : page;
      const searchTerm = searchOverride !== undefined ? searchOverride : search;
      
      const params: any = {
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
        search: searchTerm || undefined,
      };

      if (activeFilter !== 'All') {
        params.status = activeFilter;
      }

      const response = await api.getOrders(params);
      
      if (isRefresh) {
        setOrders(response.data);
      } else {
        setOrders(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === PAGE_SIZE);
      setPage(currentPage + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders(true);
    }, [activeFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      fetchOrders(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
  };

  const submitSearch = () => {
    setLoading(true);
    fetchOrders(true, search);
  };

  const handleDelete = (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete order for ${order.client_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteOrder(order.id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setOrders(prev => prev.filter(o => o.id !== order.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete order');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder || !selectedOrder.id) return;
    
    setUpdatingStatus(true);
    try {
      await api.updateOrder(selectedOrder.id, { status: newStatus });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Update local state instantly
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id ? { ...o, status: newStatus } : o
      ));
      
      setStatusModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePress = (order: Order) => {
    // router.push(`/order/${order.id}`);
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color={THEME.colors.border} />
        <Text style={styles.emptyText}>No orders found</Text>
        <Text style={styles.emptySubtext}>Try changing your filters or search term</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={THEME.colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={THEME.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by client or phone..."
            value={search}
            onChangeText={handleSearch}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            placeholderTextColor={THEME.colors.textSecondary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchOrders(true, ''); }}>
              <Ionicons name="close-circle" size={20} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTERS}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  activeFilter === item && styles.filterChipActive
                ]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === item && styles.filterTextActive
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: THEME.spacing.md }}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <OrderCard 
              order={item} 
              onPress={handlePress} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
        />
      )}


      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !updatingStatus && setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity 
                onPress={() => setStatusModalVisible(false)}
                disabled={updatingStatus}
              >
                <Ionicons name="close" size={24} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Select new status for {selectedOrder?.client_name}'s order
            </Text>

            {ORDER_STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedOrder?.status === status && styles.statusOptionSelected,
                  { borderLeftColor: STATUS_COLORS[status] || THEME.colors.border }
                ]}
                onPress={() => handleStatusChange(status)}
                disabled={updatingStatus || selectedOrder?.status === status}
              >
                <Text style={[
                  styles.statusOptionText,
                  selectedOrder?.status === status && { color: STATUS_COLORS[status], fontWeight: 'bold' }
                ]}>
                  {status}
                </Text>
                {selectedOrder?.status === status && (
                  <Ionicons name="checkmark-circle" size={20} color={STATUS_COLORS[status]} />
                )}
              </TouchableOpacity>
            ))}

            {updatingStatus && (
              <View style={styles.updatingOverlay}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* FAB for new order */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/new-order')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    backgroundColor: THEME.colors.surface,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    marginHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    height: 44,
    marginBottom: THEME.spacing.md,
  },
  searchIcon: {
    marginRight: THEME.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.colors.text,
  },
  filtersContainer: {
    height: 36,
  },
  filterChip: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.background,
    marginRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: THEME.colors.surface,
    fontWeight: 'bold',
  },
  listContent: {
    paddingTop: THEME.spacing.md,
    paddingBottom: 80, // Space for FAB
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: THEME.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.background,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.lg,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statusOptionSelected: {
    backgroundColor: THEME.colors.primary + '10',
  },
  statusOptionText: {
    fontSize: 16,
    color: THEME.colors.text,
  },
  updatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.borderRadius.xl,
  }
});
