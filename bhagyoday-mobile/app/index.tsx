import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, DashboardStats } from '../services/api';
import { THEME } from '../constants/parlour';
import { useAuth } from '../context/auth';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();

  const fetchStats = async () => {
    try {
      setError(null);
      const data = await api.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
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
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStats}>
            <Text style={styles.retryText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!stats) return null;

    return (
      <View style={styles.content}>
        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/new-order')}>
            <View style={[styles.actionIcon, { backgroundColor: THEME.colors.primaryLight }]}>
              <Ionicons name="add-circle" size={24} color={THEME.colors.surface} />
            </View>
            <Text style={styles.actionText}>New Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/orders')}>
            <View style={[styles.actionIcon, { backgroundColor: THEME.colors.secondary }]}>
              <Ionicons name="list" size={24} color={THEME.colors.surface} />
            </View>
            <Text style={styles.actionText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/reports')}>
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="bar-chart" size={24} color={THEME.colors.surface} />
            </View>
            <Text style={styles.actionText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <Text style={styles.sectionTitle}>Revenue Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.today.revenue)}</Text>
            <Text style={styles.statSubtext}>{stats.today.count} Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.this_week.revenue)}</Text>
            <Text style={styles.statSubtext}>{stats.this_week.count} Orders</Text>
          </View>
          <View style={[styles.statCard, styles.statCardFull]}>
            <Text style={styles.statLabel}>All Time Revenue</Text>
            <Text style={[styles.statValue, { color: THEME.colors.primary }]}>
              {formatCurrency(stats.all_time.revenue)}
            </Text>
            <Text style={styles.statSubtext}>{stats.all_time.count} Total Orders</Text>
          </View>
        </View>

        {/* Top Services */}
        <Text style={styles.sectionTitle}>Top Services</Text>
        <View style={styles.card}>
          {stats.top_services.length === 0 ? (
            <Text style={styles.emptyText}>No services data yet.</Text>
          ) : (
            stats.top_services.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listLeft}>
                  <Text style={styles.listIndex}>{index + 1}</Text>
                  <Text style={styles.listName}>{item.service}</Text>
                </View>
                <Text style={styles.listValue}>{item.count}x</Text>
              </View>
            ))
          )}
        </View>

        {/* Stylist Performance */}
        <Text style={styles.sectionTitle}>Stylist Performance</Text>
        <View style={[styles.card, { marginBottom: 40 }]}>
          {stats.stylist_performance.length === 0 ? (
            <Text style={styles.emptyText}>No stylist data yet.</Text>
          ) : (
            stats.stylist_performance.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listLeft}>
                  <Ionicons name="person-circle" size={24} color={THEME.colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.listName}>{item.stylist}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.listValue}>{formatCurrency(item.revenue)}</Text>
                  <Text style={styles.listSubtext}>{item.count} Orders</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Gradient Header */}
      <LinearGradient
        colors={[THEME.colors.primary, THEME.colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.headerTitle}>Bhagyoday Parlour</Text>
              <Text style={styles.headerSubtitle}>Management Dashboard</Text>
            </View>
            <TouchableOpacity onPress={signOut} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
              <Ionicons name="log-out-outline" size={24} color={THEME.colors.surface} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={THEME.colors.primary} 
            colors={[THEME.colors.primary]}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: THEME.borderRadius.xl,
    borderBottomRightRadius: THEME.borderRadius.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.colors.surface,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: THEME.spacing.sm,
    color: THEME.colors.textSecondary,
    fontSize: 16,
  },
  errorText: {
    marginTop: THEME.spacing.md,
    color: THEME.colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.pill,
  },
  retryText: {
    color: THEME.colors.surface,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
    marginTop: -THEME.spacing.sm,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statCardFull: {
    width: '100%',
  },
  statLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: THEME.spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIndex: {
    width: 24,
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.primaryLight,
  },
  listName: {
    fontSize: 16,
    color: THEME.colors.text,
    fontWeight: '500',
  },
  listValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  listSubtext: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: THEME.spacing.md,
  }
});
