import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Order } from '../services/api';
import { THEME, STATUS_COLORS } from '../constants/parlour';

interface OrderCardProps {
  order: Order;
  onPress?: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
}

export default function OrderCard({ order, onPress, onEdit, onDelete }: OrderCardProps) {
  const statusColor = STATUS_COLORS[order.status || 'Pending'] || THEME.colors.textSecondary;

  const renderPaymentIcon = () => {
    switch (order.payment_method) {
      case 'UPI':
      case 'Paytm':
      case 'PhonePe':
        return <MaterialCommunityIcons name="qrcode-scan" size={16} color={THEME.colors.textSecondary} />;
      case 'Credit Card':
      case 'Debit Card':
        return <Ionicons name="card-outline" size={16} color={THEME.colors.textSecondary} />;
      case 'Cash':
        return <Ionicons name="cash-outline" size={16} color={THEME.colors.textSecondary} />;
      case 'Pending':
        return <Ionicons name="time-outline" size={16} color={THEME.colors.textSecondary} />;
      default:
        return <Ionicons name="wallet-outline" size={16} color={THEME.colors.textSecondary} />;
    }
  };

  // Slides RIGHT (Reveals Left Action) -> Status Change
  const renderLeftActions = (progress: any, dragX: any) => {
    if (!onEdit) return null;

    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.leftActionContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: THEME.colors.secondary }]} onPress={() => onEdit(order)}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="swap-horizontal" size={28} color="#fff" />
            <Text style={styles.actionText}>Status</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  // Slides LEFT (Reveals Right Action) -> Delete
  const renderRightActions = (progress: any, dragX: any) => {
    if (!onDelete) return null;

    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: THEME.colors.error }]} onPress={() => onDelete(order)}>
          <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
            <Ionicons name="trash" size={28} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const CardContent = (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress && onPress(order)} 
      activeOpacity={1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName} numberOfLines={1}>{order.client_name}</Text>
          {order.phone && <Text style={styles.phoneText}>{order.phone}</Text>}
        </View>
        <TouchableOpacity 
          style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}
          onPress={() => onEdit && onEdit(order)}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="cut" size={16} color={THEME.colors.textSecondary} />
          <Text style={styles.detailText} numberOfLines={1}>{order.service}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="person" size={16} color={THEME.colors.textSecondary} />
          <Text style={styles.detailText} numberOfLines={1}>{order.stylist}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.timeContainer}>
            <Ionicons name="calendar-outline" size={14} color={THEME.colors.textSecondary} />
            <Text style={styles.timeText}>{order.appointment_date} at {order.appointment_time}</Text>
          </View>
          <View style={styles.paymentContainer}>
            {renderPaymentIcon()}
            <Text style={styles.paymentText}>{order.payment_method || 'Cash'}</Text>
          </View>
        </View>
        <Text style={styles.priceText}>₹{order.price?.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (onEdit || onDelete) {
    return (
      <Swipeable 
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        overshootLeft={false}
        overshootRight={false}
        friction={2}
      >
        {CardContent}
      </Swipeable>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.lg,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  clientInfo: {
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  phoneText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  detailText: {
    fontSize: 13,
    color: THEME.colors.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  footerLeft: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginLeft: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.primary,
  },
  leftActionContainer: {
    width: 80,
    marginBottom: THEME.spacing.sm,
    marginLeft: THEME.spacing.md,
  },
  rightActionContainer: {
    width: 80,
    marginBottom: THEME.spacing.sm,
    marginRight: THEME.spacing.md,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.borderRadius.lg,
  },
  actionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  }
});
