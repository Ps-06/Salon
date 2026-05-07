import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
 Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  StatusBar,
} from 'react-native';

import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { api, Order } from '../services/api';

const { width } = Dimensions.get('window');

type FormData = Omit<Order, 'id' | 'created_at' | 'updated_at'>;

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

export default function NewOrder() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;
  const snackbarAnim = useRef(new Animated.Value(120)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
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
    type: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setSnackbar({
      visible: true,
      message,
      type,
    });

    Animated.sequence([
      Animated.timing(snackbarAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.delay(2300),
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

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      client_name: '',
      phone: '',
      service: '',
      stylist: '',
      price: 0,
      payment_method: 'Cash',
      status: 'Pending',
      notes: '',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: new Date()
        .toTimeString()
        .split('T')[0]
        .substring(0, 5),
    },
  });

  const currentDateStr = watch('appointment_date');
  const currentTimeStr = watch('appointment_time');

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      await api.createOrder(data);

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      showSnackbar('Order created successfully', 'success');

      setTimeout(() => {
        router.back();
      }, 900);
    } catch (error: any) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

      showSnackbar(
        error.message || 'Failed to create order',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = () => {
    Keyboard.dismiss();

    handleSubmit(onSubmit, () => {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

      showSnackbar(
        'Please fix all required fields',
        'error'
      );
    })();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');

    if (selectedDate) {
      setValue(
        'appointment_date',
        selectedDate.toISOString().split('T')[0]
      );
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');

    if (selectedTime) {
      setValue(
        'appointment_time',
        selectedTime
          .toTimeString()
          .split(' ')[0]
          .substring(0, 5)
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <LinearGradient
                colors={[PALETTE.plum, PALETTE.plumMid]}
                style={styles.header}
              >
                <View style={styles.glowOne} />
                <View style={styles.glowTwo} />

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Ionicons
                    name="arrow-back"
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>New Order</Text>

                <Text style={styles.headerSubtitle}>
                  Enter client and service details
                </Text>
              </LinearGradient>

              <View style={styles.content}>
                {/* Client Details */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>
                    Client Details
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Client Name *
                    </Text>

                    <Controller
                      control={control}
                      name="client_name"
                      rules={{
                        required: 'Client name is required',
                        minLength: {
                          value: 3,
                          message:
                            'Minimum 3 characters required',
                        },
                      }}
                      render={({
                        field: { onChange, value },
                      }) => (
                        <TextInput
                          style={[
                            styles.input,
                            errors.client_name &&
                              styles.inputError,
                          ]}
                          value={value}
                          onChangeText={onChange}
                          placeholder="Enter full name"
                          placeholderTextColor={
                            PALETTE.textLight
                          }
                        />
                      )}
                    />

                    {errors.client_name && (
                      <Text style={styles.errorText}>
                        {errors.client_name.message}
                      </Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Phone Number
                    </Text>

                    <Controller
                      control={control}
                      name="phone"
                      rules={{
                        pattern: {
                          value: /^\d{10}$/,
                          message:
                            'Phone number must be 10 digits',
                        },
                      }}
                      render={({
                        field: { onChange, value },
                      }) => (
                        <TextInput
                          style={[
                            styles.input,
                            errors.phone &&
                              styles.inputError,
                          ]}
                          value={value}
                          onChangeText={onChange}
                          keyboardType="number-pad"
                          maxLength={10}
                          placeholder="9876543210"
                          placeholderTextColor={
                            PALETTE.textLight
                          }
                        />
                      )}
                    />

                    {errors.phone && (
                      <Text style={styles.errorText}>
                        {errors.phone.message}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Service */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>
                    Service Details
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Service *
                    </Text>

                    <Controller
                      control={control}
                      name="service"
                      rules={{
                        required: 'Service is required',
                      }}
                      render={({
                        field: { onChange, value },
                      }) => (
                        <TextInput
                          style={[
                            styles.input,
                            errors.service &&
                              styles.inputError,
                          ]}
                          value={value}
                          onChangeText={onChange}
                          placeholder="Haircut, Bridal Makeup..."
                          placeholderTextColor={
                            PALETTE.textLight
                          }
                        />
                      )}
                    />

                    {errors.service && (
                      <Text style={styles.errorText}>
                        {errors.service.message}
                      </Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Stylist *
                    </Text>

                    <Controller
                      control={control}
                      name="stylist"
                      rules={{
                        required:
                          'Stylist name is required',
                      }}
                      render={({
                        field: { onChange, value },
                      }) => (
                        <TextInput
                          style={[
                            styles.input,
                            errors.stylist &&
                              styles.inputError,
                          ]}
                          value={value}
                          onChangeText={onChange}
                          placeholder="Priya, Anjali..."
                          placeholderTextColor={
                            PALETTE.textLight
                          }
                        />
                      )}
                    />

                    {errors.stylist && (
                      <Text style={styles.errorText}>
                        {errors.stylist.message}
                      </Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Price *
                    </Text>

                    <Controller
                      control={control}
                      name="price"
                      rules={{
                        required: 'Price is required',
                        min: {
                          value: 1,
                          message:
                            'Price should be greater than 0',
                        },
                      }}
                      render={({
                        field: { onChange, value },
                      }) => (
                        <View
                          style={[
                            styles.priceContainer,
                            errors.price &&
                              styles.inputError,
                          ]}
                        >
                          <Text style={styles.rupee}>
                            ₹
                          </Text>

                          <TextInput
                            style={styles.priceInput}
                            value={
                              value
                                ? value.toString()
                                : ''
                            }
                            onChangeText={(v) =>
                              onChange(Number(v))
                            }
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={
                              PALETTE.textLight
                            }
                          />
                        </View>
                      )}
                    />

                    {errors.price && (
                      <Text style={styles.errorText}>
                        {errors.price.message}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Schedule */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>
                    Schedule & Payment
                  </Text>

                  <View style={styles.row}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.dateCard}
                      onPress={() =>
                        setShowDatePicker(true)
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={22}
                        color={PALETTE.rosegold}
                      />

                      <Text style={styles.dateText}>
                        {currentDateStr}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.dateCard}
                      onPress={() =>
                        setShowTimePicker(true)
                      }
                    >
                      <Ionicons
                        name="time-outline"
                        size={22}
                        color={PALETTE.rosegold}
                      />

                      <Text style={styles.dateText}>
                        {currentTimeStr}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(currentDateStr)}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                    />
                  )}

                  {showTimePicker && (
                    <DateTimePicker
                      value={new Date(
                        `${currentDateStr}T${currentTimeStr}:00`
                      )}
                      mode="time"
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Payment Method
                    </Text>

                    <View style={styles.pickerContainer}>
                      <Controller
                        control={control}
                        name="payment_method"
                        render={({
                          field: {
                            onChange,
                            value,
                          },
                        }) => (
                          <Picker
                            selectedValue={value}
                            onValueChange={onChange}
                            dropdownIconColor={
                              PALETTE.rosegold
                            }
                            style={styles.picker}
                          >
                            <Picker.Item
                              label="Cash"
                              value="Cash"
                            />
                            <Picker.Item
                              label="UPI"
                              value="UPI"
                            />
                            <Picker.Item
                              label="Card"
                              value="Card"
                            />
                          </Picker>
                        )}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Notes
                    </Text>

                    <Controller
                      control={control}
                      name="notes"
                      render={({
                        field: { onChange, value },
                      }) => (
                        <TextInput
                          style={[
                            styles.input,
                            styles.textArea,
                          ]}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          value={value}
                          onChangeText={onChange}
                          placeholder="Special instructions..."
                          placeholderTextColor={
                            PALETTE.textLight
                          }
                        />
                      )}
                    />
                  </View>
                </View>

                {/* Submit */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={isSubmitting}
                  onPress={handleFormSubmit}
                  style={styles.submitWrap}
                >
                  <LinearGradient
                    colors={[
                      PALETTE.rosegold,
                      PALETTE.rosegoldDark,
                    ]}
                    style={styles.submitButton}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="sparkles"
                          size={20}
                          color="#fff"
                          style={{ marginRight: 10 }}
                        />

                        <Text
                          style={styles.submitText}
                        >
                          Create Order
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 120 }} />
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Snackbar */}
      {snackbar.visible && (
        <Animated.View
          style={[
            styles.snackbar,
            {
              backgroundColor:
                snackbar.type === 'success'
                  ? '#22C55E'
                  : snackbar.type === 'error'
                  ? '#EF4444'
                  : '#F59E0B',

              transform: [
                {
                  translateY: snackbarAnim,
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={
              snackbar.type === 'success'
                ? 'checkmark-circle'
                : snackbar.type === 'error'
                ? 'close-circle'
                : 'warning'
            }
            size={18}
            color="#fff"
            style={{ marginRight: 8 }}
          />

          <Text style={styles.snackbarText}>
            {snackbar.message}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    marginTop:
      Platform.OS === 'android'
        ? -(StatusBar.currentHeight || 0)
        : 0,
    backgroundColor: PALETTE.cream,
  },

  header: {
    paddingTop: 30,
    paddingBottom: 34,
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

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
  },

  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },

  content: {
    padding: 18,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 5,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textDark,
    marginBottom: 20,
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    color: PALETTE.textMid,
    fontWeight: '700',
    fontSize: 13,
  },

  input: {
    backgroundColor: '#FAF7FC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: PALETTE.textDark,
    fontSize: 15,
    fontWeight: '600',
  },

  inputError: {
    borderColor: PALETTE.error,
  },

  errorText: {
    marginTop: 6,
    color: PALETTE.error,
    fontSize: 12,
    fontWeight: '600',
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7FC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
  },

  rupee: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.rosegold,
    marginRight: 10,
  },

  priceInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: PALETTE.textDark,
    fontWeight: '700',
  },

  textArea: {
    height: 120,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },

  dateCard: {
    flex: 1,
    backgroundColor: '#FAF7FC',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },

  dateText: {
    marginTop: 8,
    color: PALETTE.textDark,
    fontWeight: '700',
  },

  pickerContainer: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FAF7FC',
  },

  picker: {
    height: Platform.OS === 'ios' ? 160 : 54,
    width: '100%',
    color: PALETTE.textDark,
  },

  submitWrap: {
    borderRadius: 24,
    overflow: 'hidden',
  },

  submitButton: {
    height: 62,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',

    shadowColor: PALETTE.rosegold,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,
  },

  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  snackbar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: Platform.OS === 'android' ? 95 : 40,

    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 8,
  },

  snackbarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});