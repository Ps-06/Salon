import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, DashboardStats } from '../services/api';
import { useAuth } from '../context/auth';

const { width } = Dimensions.get('window');

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
  glassBg: 'rgba(255,255,255,0.08)',
  glassStroke: 'rgba(255,255,255,0.18)',
  success: '#48BB78',
  error: '#FC8181',
  warning: '#F6AD55',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const { signOut } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const snackbarAnim = useRef(new Animated.Value(100)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showSnackbar = (message: string) => {
    setSnackbar(message);

    Animated.sequence([
      Animated.timing(snackbarAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(snackbarAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setSnackbar(''));
  };

  const fetchStats = async () => {
    try {
      setError(null);
      const data = await api.getStats();
      setStats(data);

      animateIn();

      if (refreshing) {
        showSnackbar('Dashboard updated');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      showSnackbar('Failed to refresh dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.loaderRing}>
            <ActivityIndicator size="large" color={PALETTE.rosegold} />
          </View>

          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <LinearGradient
            colors={[PALETTE.error, '#FF8E8E']}
            style={styles.errorIconWrap}
          >
            <Ionicons name="alert-circle-outline" size={42} color="#fff" />
          </LinearGradient>

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.retryButton}
            onPress={fetchStats}
          >
            <LinearGradient
              colors={[PALETTE.rosegold, PALETTE.rosegoldDark]}
              style={styles.retryGradient}
            >
              <Text style={styles.retryText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (!stats) return null;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <View style={styles.content}>
          {/* Quick Actions */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.actionButton}
              onPress={() => router.push('/new-order')}
            >
              <LinearGradient
                colors={[PALETTE.rosegold, PALETTE.rosegoldDark]}
                style={styles.actionIcon}
              >
                <Ionicons name="add-circle" size={26} color="#fff" />
              </LinearGradient>

              <Text style={styles.actionText}>New Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.actionButton}
              onPress={() => router.push('/orders')}
            >
              <LinearGradient
                colors={[PALETTE.plumLight, PALETTE.plum]}
                style={styles.actionIcon}
              >
                <Ionicons name="list" size={24} color="#fff" />
              </LinearGradient>

              <Text style={styles.actionText}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.actionButton}
              onPress={() => router.push('/reports')}
            >
              <LinearGradient
                colors={['#5CBF8B', '#3F9F6F']}
                style={styles.actionIcon}
              >
                <Ionicons name="bar-chart" size={24} color="#fff" />
              </LinearGradient>

              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>

          {/* Revenue */}
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="wallet" size={24} color={PALETTE.rosegold} />
            <Text style={styles.sectionTitle}>Revenue Overview</Text>
          </View>

          <View style={styles.statsGrid}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF7F1']}
              style={styles.statCard}
            >
              <View style={styles.statCardHeader}>
                <Ionicons name="calendar-outline" size={18} color={PALETTE.warning} />
              </View>
              <Text style={styles.statLabel}>Today</Text>

              <Text style={styles.statValue}>
                {formatCurrency(stats.today.revenue)}
              </Text>

              <Text style={styles.statSubtext}>
                {stats.today.count} Orders
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={['#FFFFFF', '#F8F2FF']}
              style={styles.statCard}
            >
              <View style={styles.statCardHeader}>
                <Ionicons name="bar-chart-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.statLabel}>This Week</Text>

              <Text style={styles.statValue}>
                {formatCurrency(stats.this_week.revenue)}
              </Text>

              <Text style={styles.statSubtext}>
                {stats.this_week.count} Orders
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={[PALETTE.plumMid, PALETTE.plum]}
              style={[styles.statCard, styles.statCardFull]}
            >
              <View style={styles.statCardHeader}>
                <Ionicons name="cash-outline" size={18} color="#fff" />
              </View>
              <Text style={[styles.statLabel, { color: '#D9C5EA' }]}>
                All Time Revenue
              </Text>

              <Text style={[styles.statValue, { color: '#fff' }]}>
                {formatCurrency(stats.all_time.revenue)}
              </Text>

              <Text style={[styles.statSubtext, { color: '#D9C5EA' }]}>
                {stats.all_time.count} Total Orders
              </Text>
            </LinearGradient>
          </View>

          {/* Top Services */}
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="sparkles" size={24} color={PALETTE.rosegold} />
            <Text style={styles.sectionTitle}>Top Services</Text>
          </View>

          <View style={styles.card}>
            {stats.top_services.length === 0 ? (
              <Text style={styles.emptyText}>No services data yet.</Text>
            ) : (
              stats.top_services.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listLeft}>
                    <LinearGradient
                      colors={[PALETTE.rosegold, PALETTE.rosegoldDark]}
                      style={styles.indexBadge}
                    >
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </LinearGradient>

                    <Text style={styles.listName}>{item.service}</Text>
                  </View>

                  <Text style={styles.listValue}>{item.count}x</Text>
                </View>
              ))
            )}
          </View>

          {/* Stylists */}
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="star" size={24} color={PALETTE.rosegold} />
            <Text style={styles.sectionTitle}>Stylist Performance</Text>
          </View>

          <View
            style={[styles.card, { marginBottom: 60 }]}
          >
            {stats.stylist_performance.length === 0 ? (
              <Text style={styles.emptyText}>No stylist data yet.</Text>
            ) : (
              stats.stylist_performance.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listLeft}>
                    <LinearGradient
                      colors={[PALETTE.plumLight, PALETTE.plum]}
                      style={styles.avatar}
                    >
                      <Ionicons
                        name="person"
                        size={16}
                        color={PALETTE.warmWhite}
                      />
                    </LinearGradient>

                    <Text style={styles.listName}>{item.stylist}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.listValue}>
                      {formatCurrency(item.revenue)}
                    </Text>

                    <Text style={styles.listSubtext}>
                      {item.count} Orders
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
  <Stack.Screen options={{ headerShown: false }} />

  <StatusBar barStyle="light-content" />

  <ScrollView
    style={styles.scrollView}
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
    bounces
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={PALETTE.rosegold}
        colors={[PALETTE.rosegold]}
      />
    }
  >
    {/* Header */}
    <LinearGradient
      colors={[PALETTE.plum, PALETTE.plumMid, '#4A2E66']}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <View style={styles.headerContent}>
        <View style={styles.brandColumn}>
          <Image
            source={require('../assets/Bhagyoday_Logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <View style={styles.brandTextWrap}>
            <Text style={styles.headerTitle}>Bhagyoday Parlour</Text>
            <Text style={styles.headerSubtitle}>Management Dashboard</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowLogoutModal(true)}
          style={styles.logoutButtonHeader}
        >
          <View style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>

    {/* Content */}
    {renderContent()}
  </ScrollView>

  {/* Logout Modal */}
  <Modal
    visible={showLogoutModal}
    transparent
    animationType="fade"
    onRequestClose={() => setShowLogoutModal(false)}
  >
    <Pressable
      style={styles.modalOverlay}
      onPress={() => setShowLogoutModal(false)}
    >
      <Pressable style={styles.modalCard}>
        <LinearGradient
          colors={[PALETTE.plumMid, PALETTE.plum]}
          style={styles.modalTop}
        >
          <View style={styles.modalIcon}>
            <Ionicons
              name="log-out-outline"
              size={32}
              color="#fff"
            />
          </View>

          <Text style={styles.modalTitle}>
            Logout
          </Text>

          <Text style={styles.modalSubtitle}>
            Are you sure you want to logout from the app?
          </Text>
        </LinearGradient>

        <View style={styles.modalActions}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.cancelButton}
            onPress={() => setShowLogoutModal(false)}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={{ flex: 1 }}
            onPress={async () => {
              try {
                setShowLogoutModal(false);

                await signOut();

                showSnackbar('Logged out successfully');

                router.replace('/login');
              } catch (error) {
                showSnackbar('Failed to logout');
              }
            }}
          >
            <LinearGradient
              colors={[PALETTE.error, '#FF6B6B']}
              style={styles.logoutConfirm}
            >
              <Text style={styles.logoutConfirmText}>
                Logout
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>

  {/* Snackbar */}
  {snackbar ? (
    <Animated.View
      style={[
        styles.snackbar,
        {
          transform: [{ translateY: snackbarAnim }],
        },
      ]}
    >
      <Ionicons
        name="checkmark-circle"
        size={18}
        color={PALETTE.success}
        style={{ marginRight: 8 }}
      />

      <Text style={styles.snackbarText}>{snackbar}</Text>
    </Animated.View>
  ) : null}
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -(StatusBar.currentHeight || 0),
    backgroundColor: PALETTE.cream,
  },

  header: {
    paddingTop: 50,
    paddingBottom: 34,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
    position: 'relative',
  },

  glowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -40,
  },

  glowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: 'rgba(201,149,106,0.15)',
    bottom: -30,
    left: -20,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  brandColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerLogo: {
    width: 200,
    height: 200,
    marginBottom: -30,},

  brandTextWrap: {
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.4,
  },

  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  logoutButtonOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 100,
  },

  logoutButtonHeader: {
    position: 'absolute',
    right: 1,
    top: -30,
  },

  logoutButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassStroke,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 18,
  },

  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  actionButton: {
    alignItems: 'center',
    flex: 1,
  },

  actionIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textDark,
  },

  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  statCard: {
    width: '48%',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  statCardHeader: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  statCardFull: {
    width: '100%',
  },

  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textMid,
    marginBottom: 10,
  },

  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: PALETTE.textDark,
  },

  statSubtext: {
    marginTop: 6,
    fontSize: 12,
    color: PALETTE.textMid,
    fontWeight: '600',
  },

  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },

  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },

  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  indexBadge: {
    width: 26,
    height: 26,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  indexText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  listName: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textDark,
  },

  listValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textDark,
  },

  listSubtext: {
    fontSize: 11,
    color: PALETTE.textMid,
    marginTop: 2,
    fontWeight: '600',
  },

  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: PALETTE.textMid,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },

  loaderRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: PALETTE.rosegold,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  loadingText: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textMid,
  },

  errorIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    marginTop: 18,
    fontSize: 15,
    color: PALETTE.error,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  retryButton: {
    marginTop: 22,
    borderRadius: 18,
    overflow: 'hidden',
  },

  retryGradient: {
    paddingHorizontal: 28,
    paddingVertical: 14,
  },

  retryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    width: width - 48,
    backgroundColor: '#fff',
    borderRadius: 30,
    overflow: 'hidden',
  },

  modalTop: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },

  modalSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },

  modalActions: {
    flexDirection: 'row',
    padding: 18,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
  },

  cancelText: {
    color: PALETTE.textDark,
    fontWeight: '700',
    fontSize: 14,
  },

  logoutConfirm: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutConfirmText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  snackbar: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },

  snackbarText: {
    color: PALETTE.textDark,
    fontWeight: '700',
    fontSize: 13,
  },
});