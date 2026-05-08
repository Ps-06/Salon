import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

import { router, useFocusEffect } from 'expo-router';

import * as Haptics from 'expo-haptics';

import { api, DashboardStats } from '../services/api';

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

  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
};

export default function Reports() {
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

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
    new Animated.Value(25)
  ).current;

  const scaleAnim = useRef(
    new Animated.Value(0.96)
  ).current;

  const snackbarAnim = useRef(
    new Animated.Value(120)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 55,
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

  const fetchReports = async (
    isRefresh = false
  ) => {
    try {
      const data = await api.getStats();

      setStats(data);

      if (isRefresh) {
        showSnackbar(
          'Reports refreshed',
          'success'
        );
      }
    } catch (error) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

      showSnackbar(
        'Failed to load reports',
        'error'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      fetchReports();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);

    fetchReports(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.loadingContainer}>
          <View style={styles.loaderRing}>
            <ActivityIndicator
              size="large"
              color={PALETTE.rosegold}
            />
          </View>

          <Text style={styles.loadingText}>
            Loading Reports...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[
              PALETTE.error,
              '#FF7A7A',
            ]}
            style={styles.errorIcon}
          >
            <Ionicons
              name="alert-circle"
              size={42}
              color="#fff"
            />
          </LinearGradient>

          <Text style={styles.errorText}>
            Failed to load reports
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setLoading(true);

              fetchReports();
            }}
          >
            <LinearGradient
              colors={[
                PALETTE.rosegold,
                PALETTE.rosegoldDark,
              ]}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                Retry
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const maxServiceCount = Math.max(
    ...(stats.top_services || []).map(
      (s) => s.count || 0
    ),
    1
  );

  const maxStylistRevenue = Math.max(
    ...(stats.stylist_performance || []).map(
      (s) => s.revenue || 0
    ),
    1
  );

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

            {
              scale: scaleAnim,
            },
          ],
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PALETTE.rosegold}
              colors={[PALETTE.rosegold]}
            />
          }
          contentContainerStyle={{
            paddingBottom: 130,
          }}
        >
          {/* HEADER */}
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
              <View>
                <Text style={styles.headerTitle}>
                  Reports
                </Text>

                <Text
                  style={
                    styles.headerSubtitle
                  }
                >
                  Performance insights &
                  analytics
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  router.back()
                }
              >
                <View
                  style={
                    styles.headerButton
                  }
                >
                  <Ionicons
                    name="arrow-back"
                    size={22}
                    color="#fff"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            {/* DESCRIPTION */}
            <View style={styles.infoCard}>
              <Ionicons
                name="analytics"
                size={20}
                color={PALETTE.rosegold}
                style={{
                  marginRight: 12,
                }}
              />

              <Text style={styles.infoText}>
                Detailed breakdown of
                your parlour performance
                based on completed
                orders and revenue.
              </Text>
            </View>

            {/* REVENUE */}
            <Text style={styles.sectionTitle}>
              Revenue Snapshot
            </Text>

            <View style={styles.grid}>
              <LinearGradient
                colors={[
                  '#FFFFFF',
                  '#FFF7F1',
                ]}
                style={styles.statCard}
              >
                <View
                  style={styles.statIcon}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={
                      PALETTE.warning
                    }
                  />
                </View>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  Today
                </Text>

                <Text
                  style={
                    styles.statValue
                  }
                >
                  ₹
                  {(stats.today?.revenue || 0).toFixed(
                    2
                  )}
                </Text>

                <Text
                  style={
                    styles.statSubtext
                  }
                >
                  {
                    stats.today?.count || 0
                  }{' '}
                  orders
                </Text>
              </LinearGradient>

              <LinearGradient
                colors={[
                  '#FFFFFF',
                  '#F7F2FF',
                ]}
                style={styles.statCard}
              >
                <View
                  style={styles.statIcon}
                >
                  <Ionicons
                    name="bar-chart-outline"
                    size={22}
                    color="#3B82F6"
                  />
                </View>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  This Week
                </Text>

                <Text
                  style={
                    styles.statValue
                  }
                >
                  ₹
                  {(stats.this_week?.revenue || 0).toFixed(
                    2
                  )}
                </Text>

                <Text
                  style={
                    styles.statSubtext
                  }
                >
                  {
                    stats.this_week
                      ?.count || 0
                  }{' '}
                  orders
                </Text>
              </LinearGradient>

              <LinearGradient
                colors={[
                  PALETTE.plumMid,
                  PALETTE.plum,
                ]}
                style={[
                  styles.statCard,
                  styles.fullCard,
                ]}
              >
                <View
                  style={styles.statIconDark}
                >
                  <Ionicons
                    name="cash-outline"
                    size={22}
                    color="#fff"
                  />
                </View>

                <Text
                  style={[
                    styles.statLabel,
                    {
                      color:
                        'rgba(255,255,255,0.72)',
                    },
                  ]}
                >
                  All Time Revenue
                </Text>

                <Text
                  style={[
                    styles.statValue,
                    {
                      color: '#fff',
                    },
                  ]}
                >
                  ₹
                  {(stats.all_time?.revenue || 0).toFixed(
                    2
                  )}
                </Text>

                <Text
                  style={[
                    styles.statSubtext,
                    {
                      color:
                        'rgba(255,255,255,0.72)',
                    },
                  ]}
                >
                  {
                    stats.all_time
                      ?.count || 0
                  }{' '}
                  completed orders
                </Text>
              </LinearGradient>
            </View>

            {/* STYLIST */}
            <Text style={styles.sectionTitle}>
              Stylist Leaderboard
            </Text>

            <View style={styles.card}>
              {stats
                .stylist_performance
                .length === 0 ? (
                <Text
                  style={styles.emptyText}
                >
                  No stylist data
                  available
                </Text>
              ) : (
                stats.stylist_performance.map(
                  (
                    stylist,
                    index
                  ) => {
                    const percentage =
                      ((stylist.revenue || 0) /
                        maxStylistRevenue) *
                      100;

                    return (
                      <View
                        key={index}
                        style={
                          styles.rowItem
                        }
                      >
                        <View
                          style={
                            styles.rowHeader
                          }
                        >
                          <View
                            style={
                              styles.rowLeft
                            }
                          >
                            <LinearGradient
                              colors={[
                                PALETTE.plumLight,
                                PALETTE.plum,
                              ]}
                              style={
                                styles.avatar
                              }
                            >
                              <Ionicons
                                name="person"
                                size={15}
                                color="#fff"
                              />
                            </LinearGradient>

                            <View>
                              <Text
                                style={
                                  styles.nameText
                                }
                              >
                                {
                                  stylist.stylist
                                }
                              </Text>

                              <Text
                                style={
                                  styles.subText
                                }
                              >
                                {
                                  stylist.count || 0
                                }{' '}
                                completed
                                orders
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={
                              styles.valueText
                            }
                          >
                            ₹
                            {(stylist.revenue || 0).toFixed(
                              2
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.progressBarBg
                          }
                        >
                          <LinearGradient
                            colors={[
                              PALETTE.rosegold,
                              PALETTE.rosegoldDark,
                            ]}
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${percentage}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  }
                )
              )}
            </View>

            {/* SERVICES */}
            <Text style={styles.sectionTitle}>
              Service Popularity
            </Text>

            <View style={styles.card}>
              {stats.top_services
                .length === 0 ? (
                <Text
                  style={styles.emptyText}
                >
                  No service data
                  available
                </Text>
              ) : (
                stats.top_services.map(
                  (
                    service,
                    index
                  ) => {
                    const percentage =
                      ((service.count || 0) /
                        maxServiceCount) *
                      100;

                    return (
                      <View
                        key={index}
                        style={
                          styles.rowItem
                        }
                      >
                        <View
                          style={
                            styles.rowHeader
                          }
                        >
                          <View
                            style={
                              styles.rowLeft
                            }
                          >
                            <LinearGradient
                              colors={[
                                PALETTE.rosegold,
                                PALETTE.rosegoldDark,
                              ]}
                              style={
                                styles.indexBadge
                              }
                            >
                              <Text
                                style={
                                  styles.indexText
                                }
                              >
                                {index + 1}
                              </Text>
                            </LinearGradient>

                            <Text
                              style={
                                styles.nameText
                              }
                            >
                              {
                                service.service
                              }
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.valueText
                            }
                          >
                            {
                              service.count || 0
                            }
                            x
                          </Text>
                        </View>

                        <View
                          style={
                            styles.progressBarBg
                          }
                        >
                          <LinearGradient
                            colors={[
                              PALETTE.plumLight,
                              PALETTE.plum,
                            ]}
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${percentage}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  }
                )
              )}
            </View>
          </View>
        </ScrollView>

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
    paddingTop: 28,
    paddingBottom: 30,
    paddingHorizontal: 22,

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
  },

  headerTitle: {
    fontSize: 30,

    fontWeight: '800',

    color: '#fff',
  },

  headerSubtitle: {
    marginTop: 5,

    fontSize: 14,

    color: 'rgba(255,255,255,0.72)',

    fontWeight: '600',
  },

  headerButton: {
    width: 52,
    height: 52,

    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.08)',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.08)',
  },

  content: {
    padding: 18,
  },

  infoCard: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#fff',

    padding: 18,

    borderRadius: 24,

    marginBottom: 24,

    borderWidth: 1,

    borderColor: PALETTE.border,
  },

  infoText: {
    flex: 1,

    color: PALETTE.textMid,

    fontWeight: '600',

    lineHeight: 22,
  },

  sectionTitle: {
    fontSize: 20,

    fontWeight: '800',

    color: PALETTE.textDark,

    marginBottom: 14,
  },

  grid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',

    marginBottom: 14,
  },

  statCard: {
    width: '48%',

    borderRadius: 26,

    padding: 18,

    marginBottom: 14,

    shadowColor: '#000',

    shadowOpacity: 0.05,

    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  fullCard: {
    width: '100%',
  },

  statIcon: {
    width: 46,
    height: 46,

    borderRadius: 16,

    backgroundColor:
      'rgba(255,255,255,0.7)',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 14,
  },

  statIconDark: {
    width: 46,
    height: 46,

    borderRadius: 16,

    backgroundColor:
      'rgba(255,255,255,0.12)',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 14,
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
    backgroundColor:
      'rgba(255,255,255,0.82)',

    borderRadius: 28,

    padding: 18,

    marginBottom: 24,

    borderWidth: 1,

    borderColor: PALETTE.border,
  },

  rowItem: {
    marginBottom: 20,
  },

  rowHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 10,
  },

  rowLeft: {
    flexDirection: 'row',

    alignItems: 'center',

    flex: 1,
  },

  avatar: {
    width: 38,
    height: 38,

    borderRadius: 14,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  indexBadge: {
    width: 28,
    height: 28,

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

  nameText: {
    fontSize: 15,

    fontWeight: '700',

    color: PALETTE.textDark,
  },

  valueText: {
    fontSize: 15,

    fontWeight: '800',

    color: PALETTE.rosegoldDark,
  },

  subText: {
    marginTop: 2,

    fontSize: 12,

    color: PALETTE.textMid,

    fontWeight: '600',
  },

  progressBarBg: {
    height: 10,

    backgroundColor:
      'rgba(0,0,0,0.06)',

    borderRadius: 10,

    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',

    borderRadius: 10,
  },

  emptyText: {
    textAlign: 'center',

    paddingVertical: 24,

    color: PALETTE.textMid,

    fontWeight: '600',

    fontStyle: 'italic',
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

  errorIcon: {
    width: 90,
    height: 90,

    borderRadius: 45,

    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    marginTop: 18,

    color: PALETTE.error,

    fontWeight: '700',

    fontSize: 15,
  },

  retryButton: {
    marginTop: 22,

    paddingHorizontal: 28,

    paddingVertical: 14,

    borderRadius: 18,
  },

  retryText: {
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