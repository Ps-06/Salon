import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/parlour';
import { api, DashboardStats } from '../services/api';
import StatsCard from '../components/StatsCard';

export default function Reports() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(data => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (!stats) return <View style={styles.centerContainer}><Text>Failed to load reports</Text></View>;

  // Find max values for progress bars
  const maxServiceCount = Math.max(...stats.top_services.map(s => s.count), 1);
  const maxStylistRevenue = Math.max(...stats.stylist_performance.map(s => s.revenue), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageDescription}>
        Detailed breakdown of your parlour's performance based on completed orders.
      </Text>

      {/* Revenue Breakdown */}
      <Text style={styles.sectionTitle}>Revenue Snapshot</Text>
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <StatsCard title="Today" value={stats.today.revenue} isCurrency icon="calendar-outline" color="#FF9800" />
        </View>
        <View style={styles.gridItem}>
          <StatsCard title="This Week" value={stats.this_week.revenue} isCurrency icon="bar-chart-outline" color="#2196F3" />
        </View>
        <View style={[styles.gridItem, { width: '100%' }]}>
          <StatsCard title="All Time Revenue" value={stats.all_time.revenue} isCurrency icon="cash-outline" color={THEME.colors.success} />
        </View>
      </View>

      {/* Stylist Leaderboard */}
      <Text style={styles.sectionTitle}>Stylist Leaderboard</Text>
      <View style={styles.card}>
        {stats.stylist_performance.length === 0 ? (
          <Text style={styles.emptyText}>No data available</Text>
        ) : (
          stats.stylist_performance.map((stylist, index) => {
            const percentage = (stylist.revenue / maxStylistRevenue) * 100;
            return (
              <View key={index} style={styles.rowItem}>
                <View style={styles.rowHeader}>
                  <Text style={styles.nameText}>{stylist.stylist}</Text>
                  <Text style={styles.valueText}>₹{stylist.revenue.toFixed(2)}</Text>
                </View>
                <Text style={styles.subText}>{stylist.count} orders completed</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: THEME.colors.primary }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Service Popularity */}
      <Text style={styles.sectionTitle}>Service Popularity</Text>
      <View style={styles.card}>
        {stats.top_services.length === 0 ? (
          <Text style={styles.emptyText}>No data available</Text>
        ) : (
          stats.top_services.map((service, index) => {
            const percentage = (service.count / maxServiceCount) * 100;
            return (
              <View key={index} style={styles.rowItem}>
                <View style={styles.rowHeader}>
                  <Text style={styles.nameText}>{service.service}</Text>
                  <Text style={styles.valueText}>{service.count}x</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: THEME.colors.secondary }]} />
                </View>
              </View>
            );
          })
        )}
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  content: { padding: THEME.spacing.md },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageDescription: { fontSize: 14, color: THEME.colors.textSecondary, marginBottom: THEME.spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.colors.text, marginBottom: THEME.spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: THEME.spacing.lg },
  gridItem: { width: '48%', marginBottom: THEME.spacing.md },
  card: {
    backgroundColor: THEME.colors.surface, borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md, marginBottom: THEME.spacing.lg,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  rowItem: { marginBottom: THEME.spacing.md },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nameText: { fontSize: 15, fontWeight: '600', color: THEME.colors.text },
  valueText: { fontSize: 15, fontWeight: 'bold', color: THEME.colors.primaryDark },
  subText: { fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 8 },
  progressBarBg: { height: 8, backgroundColor: THEME.colors.border, borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  emptyText: { textAlign: 'center', color: THEME.colors.textSecondary, fontStyle: 'italic', padding: 20 }
});
