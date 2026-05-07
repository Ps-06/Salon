import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TextInputProps, 
  Platform 
} from 'react-native';
import { THEME } from '../constants/parlour';

export interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isPhone?: boolean;
}

export default function FormField({ 
  label, 
  error, 
  isPhone, 
  style, 
  onFocus, 
  onBlur, 
  ...props 
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        !!error && styles.inputError,
        props.multiline && styles.inputContainerMultiline
      ]}>
        {isPhone && (
          <View style={styles.prefixContainer}>
            <Text style={styles.prefixText}>+91</Text>
            <View style={styles.prefixDivider} />
          </View>
        )}
        
        <TextInput
          style={[
            styles.input, 
            props.multiline && styles.inputMultiline,
            style
          ]}
          placeholderTextColor={THEME.colors.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </View>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    overflow: 'hidden', // Ensures inner items respect border radius
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
  },
  inputFocused: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.surface,
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: THEME.spacing.md,
    height: '100%',
  },
  prefixText: {
    fontSize: 16,
    color: THEME.colors.text,
    fontWeight: '500',
  },
  prefixDivider: {
    width: 1,
    height: '60%',
    backgroundColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: THEME.colors.text,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: THEME.spacing.sm,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 12,
    marginTop: 4,
  }
});
