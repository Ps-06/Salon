import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api, Order } from '../services/api';
import { THEME, SERVICES, STYLISTS, PAYMENT_METHODS, ORDER_STATUSES } from '../constants/parlour';

type FormData = Omit<Order, 'id' | 'created_at' | 'updated_at'>;

export default function NewOrder() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
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
      appointment_time: new Date().toTimeString().split('T')[0].substring(0, 5),
    }
  });

  const currentDateStr = watch('appointment_date');
  const currentTimeStr = watch('appointment_time');

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await api.createOrder(data);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Order created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setValue('appointment_date', selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setValue('appointment_time', selectedTime.toTimeString().split(' ')[0].substring(0, 5));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Client Details</Text>
        
        {/* Client Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Client Name *</Text>
          <Controller
            control={control}
            rules={{ required: 'Client name is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.client_name && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Enter full name"
                placeholderTextColor={THEME.colors.textSecondary}
              />
            )}
            name="client_name"
          />
          {errors.client_name && <Text style={styles.errorText}>{errors.client_name.message}</Text>}
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <Controller
            control={control}
            rules={{ 
              pattern: {
                value: /^[6-9]\d{9}$/,
                message: 'Enter a valid 10-digit Indian phone number'
              }
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g. 9876543210"
                keyboardType="numeric"
                maxLength={10}
                placeholderTextColor={THEME.colors.textSecondary}
              />
            )}
            name="phone"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Service Details</Text>

        {/* Service */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service *</Text>
          <Controller
            control={control}
            rules={{ required: 'Service is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.service && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g. Haircut, Bridal Makeup..."
                placeholderTextColor={THEME.colors.textSecondary}
              />
            )}
            name="service"
          />
          {errors.service && <Text style={styles.errorText}>{errors.service.message}</Text>}
        </View>

        {/* Stylist */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Stylist *</Text>
          <Controller
            control={control}
            rules={{ required: 'Stylist name is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.stylist && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g. Priya, Anjali..."
                placeholderTextColor={THEME.colors.textSecondary}
              />
            )}
            name="stylist"
          />
          {errors.stylist && <Text style={styles.errorText}>{errors.stylist.message}</Text>}
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (₹) *</Text>
          <Controller
            control={control}
            rules={{ required: 'Price is required', min: { value: 0, message: 'Invalid price' } }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[styles.input, styles.priceInput, errors.price && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={(val) => onChange(Number(val))}
                  value={value ? value.toString() : ''}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={THEME.colors.textSecondary}
                />
              </View>
            )}
            name="price"
          />
          {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Schedule & Payment</Text>

        {/* Date and Time row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: THEME.colors.text }}>{currentDateStr}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
              <Text style={{ color: THEME.colors.text }}>{currentTimeStr}</Text>
            </TouchableOpacity>
          </View>
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
            value={new Date(`${currentDateStr}T${currentTimeStr}:00`)}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {/* Payment Method */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.pickerContainer}>
            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                  {PAYMENT_METHODS.map(s => <Picker.Item key={s} label={s} value={s} />)}
                </Picker>
              )}
              name="payment_method"
            />
          </View>
        </View>

        {/* Status */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerContainer}>
            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                  {ORDER_STATUSES.map(s => <Picker.Item key={s} label={s} value={s} />)}
                </Picker>
              )}
              name="status"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={3}
                placeholder="Any special requests or details..."
                placeholderTextColor={THEME.colors.textSecondary}
                textAlignVertical="top"
              />
            )}
            name="notes"
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={THEME.colors.surface} />
        ) : (
          <Text style={styles.submitButtonText}>Create Order</Text>
        )}
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.md,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.primaryDark,
    marginBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: THEME.colors.text,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
  },
  currencySymbol: {
    fontSize: 18,
    paddingLeft: THEME.spacing.md,
    color: THEME.colors.textSecondary,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  textArea: {
    height: 80,
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
    width: '100%',
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  submitButtonDisabled: {
    backgroundColor: THEME.colors.primaryLight,
  },
  submitButtonText: {
    color: THEME.colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
