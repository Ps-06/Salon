import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../constants/parlour';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  isCurrency?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = THEME.colors.primary,
  isCurrency = false,
  trend,
  trendValue,
}: StatsCardProps) {
  // Format the value based on whether it's currency
  const displayValue = isCurrency 
    ? `₹${typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 }) : value}`
    : value;

  // Add some transparency to the base color to create a sleek gradient
  const gradientColors: [string, string] = [color, color + 'CC']; // 100% to 80% opacity

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {displayValue}
        </Text>
      </View>

      <View style={styles.footer}>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'} 
              size={14} 
              color="#FFFFFF" 
              style={styles.trendIcon}
            />
            <Text style={styles.trendText}>{trendValue}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    marginVertical: THEME.spacing.xs,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
    marginLeft: THEME.spacing.sm,
  },
  trendIcon: {
    marginRight: 4,
  },
  trendText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  }
});
