import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, Order } from '../services/api';
import OrderCard from '../components/OrderCard';

const { width } = Dimensions.get('window');

const FILTERS = [
  'All',
  'Pending',
  'In Progress',
  'Completed',
  'Cancelled',
];

const PAGE_SIZE = 15;

const PALETTE = {
  rosegold: '#C9956A',
  rosegoldLight: '#E8BFA0',
  rosegoldDark: '#A07040',

  plum: '#2D1B3D',
  plumMid: '#3D2455',
  plumLight: '#5C3A75',

  cream: '#FDF6F0',
  warmWhite: '#FFFFFF',

  textDark: '#1A0E26',
  textMid: '#6B5680',
  textLight: '#9E88B0',

  border: 'rgba(201,149,106,0.25)',

  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
};

const STATUS_COLORS: any = {
  Pending: '#F59E0B',
  'In Progress': '#3B82F6',
  Completed: '#16A34A',
  Cancelled: '#DC2626',
};

export default function Orders() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [activeFilter, setActiveFilter] =
    useState('All');

  const [page, setPage] = useState(0);

  const [hasMore, setHasMore] =
    useState(true);

  const [
    statusModalVisible,
    setStatusModalVisible,
  ] = useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [
    deleteModalVisible,
    setDeleteModalVisible,
  ] = useState(false);

  const [orderToDelete, setOrderToDelete] =
    useState<Order | null>(null);

  const [snackbar, setSnackbar] =
    useState({
      visible: false,
      message: '',
      type: 'success',
    });

  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

  const slideAnim = useRef(
    new Animated.Value(20)
  ).current;

  const snackbarAnim = useRef(
    new Animated.Value(120)
  ).current;

  const modalScaleAnim = useRef(
    new Animated.Value(0.9)
  ).current;

  const modalOpacityAnim = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const openModalAnimation = () => {
    Animated.parallel([
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.spring(modalScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModalAnimation = (
    callback?: () => void
  ) => {
    Animated.parallel([
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),

      Animated.timing(modalScaleAnim, {
        toValue: 0.9,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
    });
  };

  const showSnackbar = (
    message: string,
    type:
      | 'success'
      | 'error'
      | 'warning' = 'success'
  ) => {
    setSnackbar({
      visible: true,
      message,
      type,
    });

    Animated.sequence([
      Animated.timing(snackbarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),

      Animated.delay(2200),

      Animated.timing(snackbarAnim, {
        toValue: 120,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSnackbar((prev) => ({
        ...prev,
        visible: false,
      }));
    });
  };

  const fetchOrders = async (
    isRefresh = false,
    searchOverride?: string
  ) => {
    try {
      if (isRefresh) {
        setPage(0);
        setHasMore(true);
      }

      const currentPage = isRefresh
        ? 0
        : page;

      const searchTerm =
        searchOverride !== undefined
          ? searchOverride
          : search;

      const params: any = {
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
        search: searchTerm || undefined,
      };

      if (activeFilter !== 'All') {
        params.status = activeFilter;
      }

      const response =
        await api.getOrders(params);

      if (isRefresh) {
        setOrders(response.data);
      } else {
        setOrders((prev) => [
          ...prev,
          ...response.data,
        ]);
      }

      setHasMore(
        response.data.length === PAGE_SIZE
      );

      setPage(currentPage + 1);
    } catch (error) {
      showSnackbar(
        'Failed to fetch orders',
        'error'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

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
    if (
      !loadingMore &&
      hasMore &&
      !loading
    ) {
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

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);

    setStatusModalVisible(true);

    modalScaleAnim.setValue(0.9);
    modalOpacityAnim.setValue(0);

    openModalAnimation();
  };

  const closeStatusModal = () => {
    closeModalAnimation(() => {
      setStatusModalVisible(false);
    });
  };

  const openDeleteModal = (order: Order) => {
    setOrderToDelete(order);

    setDeleteModalVisible(true);

    modalScaleAnim.setValue(0.9);
    modalOpacityAnim.setValue(0);

    openModalAnimation();
  };

  const closeDeleteModal = () => {
    closeModalAnimation(() => {
      setDeleteModalVisible(false);
      setOrderToDelete(null);
    });
  };

  const deleteOrder = async () => {
    if (!orderToDelete?.id) return;

    try {
      await api.deleteOrder(
        orderToDelete.id
      );

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType
          .Success
      );

      setOrders((prev) =>
        prev.filter(
          (o) => o.id !== orderToDelete.id
        )
      );

      showSnackbar(
        'Order deleted successfully',
        'success'
      );

      closeDeleteModal();
    } catch (error) {
      showSnackbar(
        'Failed to delete order',
        'error'
      );
    }
  };

  const handleEdit = (order: Order) => {
    openStatusModal(order);
  };

  const handleStatusChange = async (
    newStatus: string
  ) => {
    if (
      !selectedOrder ||
      !selectedOrder.id
    )
      return;

    setUpdatingStatus(true);

    try {
      await api.updateOrder(
        selectedOrder.id,
        {
          status: newStatus,
        }
      );

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType
          .Success
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: newStatus,
              }
            : o
        )
      );

      showSnackbar(
        `Status updated to ${newStatus}`,
        'success'
      );

      closeStatusModal();
    } catch (error) {
      showSnackbar(
        'Failed to update order status',
        'error'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePress = (
    order: Order
  ) => {};

  const renderEmptyComponent = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={[
            PALETTE.plumMid,
            PALETTE.plum,
          ]}
          style={styles.emptyIconWrap}
        >
          <Ionicons
            name="document-text-outline"
            size={40}
            color="#fff"
          />
        </LinearGradient>

        <Text style={styles.emptyText}>
          No orders found
        </Text>

        <Text style={styles.emptySubtext}>
          Try changing your filters or
          search keyword
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore)
      return <View style={{ height: 120 }} />;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator
          size="small"
          color={PALETTE.rosegold}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim,
            },
          ],
        }}
      >
        <LinearGradient
          colors={[
            PALETTE.plum,
            PALETTE.plumMid,
          ]}
          style={styles.header}
        >
          <View style={styles.glowOne} />

          <View style={styles.glowTwo} />

          <View style={styles.headerTop}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.15)',
                  'rgba(255,255,255,0.08)',
                ]}
                style={styles.backButtonGradient}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                Orders
              </Text>

              <Text
                style={styles.headerSubtitle}
              >
                All your salon orders
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push('/new-order')
              }
              style={styles.addButton}
            >
              <LinearGradient
                colors={[
                  PALETTE.rosegold,
                  PALETTE.rosegoldDark,
                ]}
                style={styles.headerButton}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={PALETTE.textLight}
              style={{
                marginRight: 10,
              }}
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Search by client or phone..."
              value={search}
              onChangeText={handleSearch}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              placeholderTextColor={
                PALETTE.textLight
              }
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearch('');

                  fetchOrders(true, '');
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={PALETTE.textLight}
                />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View style={styles.filtersWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            data={FILTERS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.filterChip,

                  activeFilter === item &&
                    styles.filterChipActive,
                ]}
                onPress={() =>
                  setActiveFilter(item)
                }
              >
                <Text
                  style={[
                    styles.filterText,

                    activeFilter === item &&
                      styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{
              paddingHorizontal: 18,
            }}
          />
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loaderRing}>
              <ActivityIndicator
                size="large"
                color={PALETTE.rosegold}
              />
            </View>

            <Text style={styles.loadingText}>
              Loading Orders...
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item, index) =>
              (item && item.id != null ? String(item.id) : String(index))
            }
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onPress={handlePress}
                onEdit={handleEdit}
                onDelete={() =>
                  openDeleteModal(item)
                }
              />
            )}
            contentContainerStyle={
              styles.listContent
            }
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              renderEmptyComponent
            }
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={
              false
            }
          />
        )}

        {/* STATUS MODAL */}
        <Modal
          visible={statusModalVisible}
          transparent
          animationType="none"
          onRequestClose={closeStatusModal}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={closeStatusModal}
          >
            <Animated.View
              style={[
                styles.modalCard,
                {
                  opacity:
                    modalOpacityAnim,
                  transform: [
                    {
                      scale:
                        modalScaleAnim,
                    },
                  ],
                },
              ]}
            >
              <Pressable>
                <LinearGradient
                  colors={[
                    PALETTE.plumMid,
                    PALETTE.plum,
                  ]}
                  style={styles.modalTop}
                >
                  <TouchableOpacity
                    style={
                      styles.modalCloseButton
                    }
                    onPress={
                      closeStatusModal
                    }
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  <View
                    style={styles.modalIcon}
                  >
                    <Ionicons
                      name="sparkles"
                      size={28}
                      color="#fff"
                    />
                  </View>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Update Status
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Change status for{' '}
                    {
                      selectedOrder?.client_name
                    }
                  </Text>
                </LinearGradient>

                <View
                  style={
                    styles.statusContainer
                  }
                >
                  {FILTERS.slice(1).map(
                    (status) => (
                      <TouchableOpacity
                        key={status}
                        activeOpacity={
                          0.9
                        }
                        style={[
                          styles.statusOption,
                          {
                            borderLeftColor:
                              STATUS_COLORS[
                                status
                              ],
                          },

                          selectedOrder?.status ===
                            status &&
                            styles.statusOptionSelected,
                        ]}
                        onPress={() =>
                          handleStatusChange(
                            status
                          )
                        }
                        disabled={
                          updatingStatus
                        }
                      >
                        <View
                          style={{
                            flexDirection:
                              'row',
                            alignItems:
                              'center',
                          }}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor:
                                  STATUS_COLORS[
                                    status
                                  ],
                              },
                            ]}
                          />

                          <Text
                            style={[
                              styles.statusOptionText,

                              selectedOrder?.status ===
                                status && {
                                color:
                                  STATUS_COLORS[
                                    status
                                  ],
                              },
                            ]}
                          >
                            {status}
                          </Text>
                        </View>

                        {selectedOrder?.status ===
                          status && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color={
                              STATUS_COLORS[
                                status
                              ]
                            }
                          />
                        )}
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {updatingStatus && (
                  <View
                    style={
                      styles.updatingOverlay
                    }
                  >
                    <ActivityIndicator
                      size="large"
                      color={
                        PALETTE.rosegold
                      }
                    />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* DELETE MODAL */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="none"
          onRequestClose={closeDeleteModal}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={closeDeleteModal}
          >
            <Animated.View
              style={[
                styles.deleteModalCard,
                {
                  opacity:
                    modalOpacityAnim,
                  transform: [
                    {
                      scale:
                        modalScaleAnim,
                    },
                  ],
                },
              ]}
            >
              <Pressable>
                <TouchableOpacity
                  style={
                    styles.modalCloseDark
                  }
                  onPress={
                    closeDeleteModal
                  }
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={
                      PALETTE.textDark
                    }
                  />
                </TouchableOpacity>

                <LinearGradient
                  colors={[
                    '#F87171',
                    '#DC2626',
                  ]}
                  style={
                    styles.deleteIconWrap
                  }
                >
                  <Ionicons
                    name="trash"
                    size={32}
                    color="#fff"
                  />
                </LinearGradient>

                <Text
                  style={
                    styles.deleteTitle
                  }
                >
                  Delete Order?
                </Text>

                <Text
                  style={
                    styles.deleteSubtitle
                  }
                >
                  This action cannot be
                  undone.
                </Text>

                <View
                  style={
                    styles.deleteActions
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.cancelDeleteButton
                    }
                    onPress={
                      closeDeleteModal
                    }
                  >
                    <Text
                      style={
                        styles.cancelDeleteText
                      }
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={deleteOrder}
                  >
                    <LinearGradient
                      colors={[
                        '#F87171',
                        '#DC2626',
                      ]}
                      style={
                        styles.confirmDeleteButton
                      }
                    >
                      <Text
                        style={
                          styles.confirmDeleteText
                        }
                      >
                        Delete
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* SNACKBAR */}
        {snackbar.visible && (
          <Animated.View
            style={[
              styles.snackbar,
              {
                backgroundColor:
                  snackbar.type ===
                  'success'
                    ? PALETTE.success
                    : snackbar.type ===
                      'error'
                    ? PALETTE.error
                    : PALETTE.warning,

                transform: [
                  {
                    translateY:
                      snackbarAnim,
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={
                snackbar.type ===
                'success'
                  ? 'checkmark-circle'
                  : snackbar.type ===
                    'error'
                  ? 'close-circle'
                  : 'warning'
              }
              size={20}
              color="#fff"
              style={{
                marginRight: 10,
              }}
            />

            <Text
              style={styles.snackbarText}
            >
              {snackbar.message}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,

    marginTop:
      Platform.OS === 'android'
        ? -(
            StatusBar.currentHeight || 0
          )
        : 0,

    backgroundColor: PALETTE.cream,
  },

  header: {
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },

  glowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor:
      'rgba(255,255,255,0.05)',
    top: -60,
    right: -40,
  },

  glowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor:
      'rgba(201,149,106,0.15)',
    bottom: -30,
    left: -20,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },

  backButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
  },

  backButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  addButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
  },

  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
  },

  headerSubtitle: {
    marginTop: 5,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 14,
  },

  headerButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 58,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  filtersWrapper: {
    marginTop: 18,
    marginBottom: 10,
  },

  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },

  filterChipActive: {
    backgroundColor: PALETTE.plum,
  },

  filterText: {
    color: PALETTE.textDark,
    fontWeight: '700',
    fontSize: 13,
  },

  filterTextActive: {
    color: '#fff',
  },

  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 130,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loaderRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: PALETTE.rosegold,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 8,
  },

  loadingText: {
    marginTop: 18,
    color: PALETTE.textMid,
    fontWeight: '700',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },

  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    marginTop: 22,
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textDark,
  },

  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: PALETTE.textMid,
    textAlign: 'center',
  },

  footerLoader: {
    paddingVertical: 24,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },

  modalCard: {
    width: width - 44,
    backgroundColor: '#fff',
    borderRadius: 30,
    overflow: 'hidden',
  },

  modalTop: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  modalCloseButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 10,
  },

  modalCloseDark: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 10,
  },

  modalIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor:
      'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },

  modalSubtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },

  statusContainer: {
    padding: 18,
  },

  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF7FC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    borderLeftWidth: 5,
  },

  statusOptionSelected: {
    backgroundColor:
      'rgba(201,149,106,0.12)',
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 12,
  },

  statusOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textDark,
  },

  updatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteModalCard: {
    width: width - 56,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 26,
    alignItems: 'center',
  },

  deleteIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },

  deleteTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.textDark,
  },

  deleteSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: PALETTE.textMid,
    textAlign: 'center',
    lineHeight: 22,
  },

  deleteActions: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 12,
  },

  cancelDeleteButton: {
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelDeleteText: {
    color: PALETTE.textDark,
    fontWeight: '700',
  },

  confirmDeleteButton: {
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmDeleteText: {
    color: '#fff',
    fontWeight: '800',
  },

  snackbar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom:
      Platform.OS === 'android'
        ? 24
        : 40,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 10,
  },

  snackbarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});