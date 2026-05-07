import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../services/api';
import { useAuth } from '../context/auth';

const { width } = Dimensions.get('window');
const googleClientId = '119579831091-do34238j3993hbr7jn2a7i2vmujdvo6q.apps.googleusercontent.com';

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// SNACKBAR
// ─────────────────────────────────────────────
interface SnackbarProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
  onHide: () => void;
  /** Pass insets.bottom so snackbar sits above Android nav bar */
  bottomOffset: number;
}

const Snackbar: React.FC<SnackbarProps> = ({ message, type, visible, onHide, bottomOffset }) => {
  const translateY = useRef(new Animated.Value(160)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  const iconMap = {
    success: 'checkmark-circle',
    error: 'close-circle',
    info: 'information-circle',
    warning: 'warning',
  } as const;

  const colorMap = {
    success: PALETTE.success,
    error: PALETTE.error,
    info: PALETTE.rosegold,
    warning: PALETTE.warning,
  };

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(160);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0, useNativeDriver: true, tension: 80, friction: 10,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 160, duration: 350,
          easing: Easing.in(Easing.back(1.5)), useNativeDriver: true,
        }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }, 3200);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  // Sit 16 px above nav bar; minimum 24 px for devices with no nav bar
  const snackBottom = Math.max(bottomOffset + 16, 24);

  return (
    <Animated.View
      style={[snackStyles.container, { bottom: snackBottom, transform: [{ translateY }], opacity }]}
    >
      <LinearGradient
        colors={['rgba(45,27,61,0.97)', 'rgba(61,36,85,0.97)']}
        style={snackStyles.inner}
      >
        <View style={[snackStyles.iconBg, { backgroundColor: colorMap[type] + '22' }]}>
          <Ionicons name={iconMap[type]} size={20} color={colorMap[type]} />
        </View>
        <Text style={snackStyles.message}>{message}</Text>
        <TouchableOpacity onPress={onHide} style={snackStyles.closeBtn}>
          <Ionicons name="close" size={16} color={PALETTE.textLight} />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const snackStyles = StyleSheet.create({
  container: {
    position: 'absolute', left: 16, right: 16,
    zIndex: 9999, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 20,
  },
  inner: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: PALETTE.glassStroke, borderRadius: 16,
  },
  iconBg: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  message: { flex: 1, fontSize: 14, color: '#F0E8FF', fontWeight: '500', letterSpacing: 0.2, lineHeight: 20 },
  closeBtn: { padding: 4, marginLeft: 8 },
});

// ─────────────────────────────────────────────
// ANIMATED INPUT
// ─────────────────────────────────────────────
interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  maxLength?: number;
  error?: string;
  icon: string;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', autoCapitalize = 'none',
  maxLength, error, icon,
}) => {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused || value ? 1 : 0, duration: 200, useNativeDriver: false,
    }).start();
  }, [focused, value]);

  useEffect(() => {
    if (!error) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }, [error]);

  const labelTop   = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 2] });
  const labelSize  = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1], outputRange: [PALETTE.textLight, PALETTE.rosegold],
  });
  const borderColor = error ? PALETTE.error : focused ? PALETTE.rosegold : PALETTE.border;

  return (
    <Animated.View style={[inputStyles.wrapper, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={[inputStyles.container, { borderColor }]}>
        <View style={inputStyles.iconBox}>
          <Ionicons name={icon as any} size={18} color={focused ? PALETTE.rosegold : PALETTE.textLight} />
        </View>
        <View style={inputStyles.inputArea}>
          <Animated.Text style={[inputStyles.label, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
            {label}
          </Animated.Text>
          <TextInput
            style={inputStyles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={focused || !value ? '' : placeholder}
            placeholderTextColor={PALETTE.textLight}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            maxLength={maxLength}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            selectionColor={PALETTE.rosegold}
          />
        </View>
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={inputStyles.clearBtn}>
            <Ionicons name="close-circle" size={16} color={PALETTE.textLight} />
          </TouchableOpacity>
        )}
      </View>
      {!!error && (
        <View style={inputStyles.errorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={PALETTE.error} />
          <Text style={inputStyles.errorText}>{error}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PALETTE.glassBg,
    borderWidth: 1.5, borderRadius: 16, height: 64, overflow: 'hidden',
  },
  iconBox: {
    width: 52, height: '100%', justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderRightColor: PALETTE.border,
  },
  inputArea: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
  label: { position: 'absolute', left: 14, fontWeight: '500', letterSpacing: 0.3, zIndex: 1 },
  input: { fontSize: 15, color: PALETTE.textDark, paddingTop: 18, paddingBottom: 4, fontWeight: '500' },
  clearBtn: { paddingHorizontal: 14 },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginLeft: 4, gap: 4 },
  errorText: { fontSize: 12, color: PALETTE.error, fontWeight: '500' },
});

// ─────────────────────────────────────────────
// PRIMARY BUTTON
// ─────────────────────────────────────────────
interface PrimaryButtonProps {
  onPress: () => void;
  loading: boolean;
  label: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ onPress, loading, label }) => {
  const scale   = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: width * 2, duration: 2400, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: -width, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
        disabled={loading} activeOpacity={0.9} style={btnStyles.wrapper}
      >
        <LinearGradient
          colors={[PALETTE.rosegoldLight, PALETTE.rosegold, PALETTE.rosegoldDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={btnStyles.gradient}
        >
          <Animated.View style={[btnStyles.shimmer, { transform: [{ translateX: shimmer }] }]} />
          {loading ? (
            <ActivityIndicator color={PALETTE.warmWhite} size="small" />
          ) : (
            <View style={btnStyles.content}>
              <Text style={btnStyles.label}>{label}</Text>
              <Ionicons name="arrow-forward" size={18} color={PALETTE.warmWhite} />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const btnStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 16, overflow: 'hidden', marginTop: 8,
    shadowColor: PALETTE.rosegold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 10,
  },
  gradient: { height: 58, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  shimmer: {
    position: 'absolute', top: 0, width: 60, height: '200%',
    backgroundColor: 'rgba(255,255,255,0.22)', transform: [{ rotate: '20deg' }],
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 16, fontWeight: '700', color: PALETTE.warmWhite, letterSpacing: 0.5 },
});

// ─────────────────────────────────────────────
// GOOGLE LINK MODAL
// ─────────────────────────────────────────────
interface GoogleModalProps {
  visible: boolean;
  loading: boolean;
  onGoBack: () => void;
  onContinueOtp: () => void;
}

const GoogleLinkModal: React.FC<GoogleModalProps> = ({ visible, loading, onGoBack, onContinueOtp }) => {
  const scale    = useRef(new Animated.Value(0.8)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(scale,   { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scale,    { toValue: 0.85, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity,  { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onGoBack}>
      <Animated.View style={[modalStyles.backdrop, { opacity: backdrop }]}>
        <Animated.View style={[modalStyles.card, { opacity, transform: [{ scale }] }]}>
          <View style={modalStyles.iconRing}>
            <LinearGradient
              colors={[PALETTE.rosegoldLight, PALETTE.rosegold]}
              style={modalStyles.iconGradient}
            >
              <Ionicons name="logo-google" size={28} color={PALETTE.warmWhite} />
            </LinearGradient>
          </View>
          <Text style={modalStyles.title}>Google-Linked Account</Text>
          <Text style={modalStyles.body}>
            This email is already linked with Google Sign-In. Use Google to sign in instantly, or
            continue with OTP to also enable email login.
          </Text>
          <View style={modalStyles.divider} />
          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.ghostBtn} onPress={onGoBack} disabled={loading}>
              <Text style={modalStyles.ghostBtnText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.solidBtn} onPress={onContinueOtp}
              disabled={loading} activeOpacity={0.85}
            >
              <LinearGradient
                colors={[PALETTE.rosegold, PALETTE.rosegoldDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={modalStyles.solidBtnGradient}
              >
                <Text style={modalStyles.solidBtnText}>Continue with OTP</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(20,8,35,0.75)',
    justifyContent: 'center', paddingHorizontal: 24,
  },
  card: {
    backgroundColor: PALETTE.cream, borderRadius: 28, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.4, shadowRadius: 40, elevation: 20,
  },
  iconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: PALETTE.rosegoldLight + '22',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 2, borderColor: PALETTE.rosegoldLight + '44',
  },
  iconGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: PALETTE.textDark, marginBottom: 10, textAlign: 'center' },
  body: { fontSize: 14, color: PALETTE.textMid, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  divider: { width: '100%', height: 1, backgroundColor: PALETTE.border, marginBottom: 20 },
  actions: { flexDirection: 'row', width: '100%', gap: 10 },
  ghostBtn: {
    flex: 1, height: 48, justifyContent: 'center', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5, borderColor: PALETTE.border,
  },
  ghostBtnText: { fontSize: 14, fontWeight: '600', color: PALETTE.textMid },
  solidBtn: {
    flex: 1.6, borderRadius: 14, overflow: 'hidden',
    shadowColor: PALETTE.rosegold,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  solidBtnGradient: { height: 48, justifyContent: 'center', alignItems: 'center' },
  solidBtnText: { fontSize: 14, fontWeight: '700', color: PALETTE.warmWhite, letterSpacing: 0.3 },
});

// ─────────────────────────────────────────────
// FLOATING ORB
// ─────────────────────────────────────────────
const FloatingOrb: React.FC<{ style: object; color: string; size: number; delay?: number }> = ({
  style, color, size, delay = 0,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dur = 3200 + Math.random() * 1800;
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(floatAnim, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const orbOpacity = floatAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 0.65, 0.35] });

  return (
    <Animated.View
      style={[
        style,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, position: 'absolute' },
        { transform: [{ translateY }], opacity: orbOpacity },
      ]}
    />
  );
};

// ─────────────────────────────────────────────
// OTP PROGRESS DOTS
// ─────────────────────────────────────────────
const OtpDots: React.FC<{ value: string }> = ({ value }) => (
  <View style={otpStyles.row}>
    {Array.from({ length: 6 }).map((_, i) => (
      <View
        key={i}
        style={[
          otpStyles.dot,
          i < value.length
            ? { backgroundColor: PALETTE.rosegold, transform: [{ scale: 1.2 }] }
            : { backgroundColor: PALETTE.border },
        ]}
      />
    ))}
  </View>
);

const otpStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: -4, marginBottom: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

// ─────────────────────────────────────────────
// MAIN LOGIN SCREEN
// ─────────────────────────────────────────────
export default function Login() {
  /**
   * useSafeAreaInsets gives us exact pixel values for:
   *  - insets.top    → status bar / notch height
   *  - insets.bottom → home indicator (iOS) or nav bar (Android)
   *
   * These values are 0 when the system doesn't have those UI elements,
   * so the logic is the same on every device.
   */
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otpSession, setOtpSession] = useState<string | null>(null);
  const [showGoogleLinkModal, setShowGoogleLinkModal] = useState(false);
  const [linkGoogleAccount, setLinkGoogleAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError]     = useState('');
  const [snack, setSnack] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });

  const showSnack = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      // Reset first so the same snack type can retrigger
      setSnack({ visible: false, message: '', type: 'info' });
      requestAnimationFrame(() => setSnack({ visible: true, message, type }));
    },
    []
  );
  const hideSnack = useCallback(() => setSnack(s => ({ ...s, visible: false })), []);

  // ── Entry animations ──────────────────────
  const logoScale     = useRef(new Animated.Value(0.5)).current;
  const logoRotate    = useRef(new Animated.Value(0)).current;
  const headerSlide   = useRef(new Animated.Value(-50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide     = useRef(new Animated.Value(50)).current;
  const cardOpacity   = useRef(new Animated.Value(0)).current;

  // ── Step-change animations ─────────────────
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const stepSlide   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.timing(logoRotate, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (!googleClientId) return;
    GoogleSignin.configure({ webClientId: googleClientId, offlineAccess: false });
  }, []);

  const logoRotateDeg = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['-20deg', '0deg'] });

  // ── Validation ────────────────────────────
  const validateEmail = (val: string) => {
    if (!val.trim())                             { setEmailError('Email is required');            return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) { setEmailError('Enter a valid email address'); return false; }
    setEmailError(''); return true;
  };

  const validateOtp = (val: string) => {
    if (!val.trim())              { setOtpError('OTP is required');           return false; }
    if (val.trim().length < 6)   { setOtpError('OTP must be 6 digits');      return false; }
    if (!/^\d{6}$/.test(val))    { setOtpError('OTP must contain only digits'); return false; }
    setOtpError(''); return true;
  };

  // ── Step transition ───────────────────────
  const transitionToStep = (next: 'email' | 'otp') => {
    Animated.parallel([
      Animated.timing(stepOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(stepSlide,   { toValue: -24, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      stepSlide.setValue(24);
      Animated.parallel([
        Animated.timing(stepOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(stepSlide,   { toValue: 0, tension: 80, friction: 9, useNativeDriver: true }),
      ]).start();
    });
  };

  // ── Handlers (no functionality changes) ──
  const handleSendOtp = async () => {
    if (!validateEmail(email)) return;
    setLoading(true);
    try {
      const data = await authApi.sendOtp(email);
      setOtpSession(data.otpSession || null);
      setLinkGoogleAccount(false);
      if (data.accountLinkedWithGoogle) {
        setShowGoogleLinkModal(true);
      } else {
        transitionToStep('otp');
        showSnack('Login code sent! Check your email.', 'success');
      }
    } catch (err: any) {
      showSnack(err.message || 'Could not send OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp(otp)) return;
    if (!otpSession) {
      showSnack('Session expired. Please request a new OTP.', 'warning');
      transitionToStep('email');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(email, otp, otpSession, linkGoogleAccount);
      await signIn(data.token, data.user);
      showSnack('Welcome back! Signing you in…', 'success');
    } catch (err: any) {
      setOtpError('Invalid or expired code. Try again.');
      showSnack('Invalid code. Please double-check and retry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleClientId) { showSnack('Google Sign-In is not configured.', 'error'); return; }
    setLoading(true);
    try {
      await GoogleSignin.signOut(); // Ensure fresh login each time
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return;
      const userInfo = response.data;
      const idToken  = userInfo.idToken;
      if (!idToken) throw new Error('Missing Google ID token');
      const displayName =
        userInfo.user.name ||
        [userInfo.user.givenName, userInfo.user.familyName].filter(Boolean).join(' ') ||
        'Google User';
      const data = await authApi.googleLogin(idToken, userInfo.user.email, displayName);
      await signIn(data.token, data.user);
    } catch (err: any) {
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (err?.code === statusCodes.IN_PROGRESS) return;
      if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showSnack('Google Play Services is not available on this device.', 'error'); return;
      }
      showSnack(err.message || 'Google sign-in failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    transitionToStep('email');
    setOtp(''); setOtpSession(null); setLinkGoogleAccount(false); setOtpError('');
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    /**
     * LAYOUT STRATEGY
     * ───────────────
     * root (flex:1, backgroundColor=cream)
     *   └─ StatusBar (translucent, gradient shows behind it)
     *   └─ KeyboardAvoidingView (flex:1)
     *        └─ ScrollView (entire screen scrolls — header + card together)
     *             ├─ LinearGradient header  (paddingTop = insets.top + 20)
     *             └─ Card                   (marginTop = -28 to overlap header)
     *   └─ GoogleLinkModal  (outside scroll — Modal covers full screen)
     *   └─ Snackbar         (outside scroll — absolute, bottom = insets.bottom + 16)
     *
     * WHY this avoids the Android nav bar issue:
     *  - The ScrollView's contentContainerStyle has paddingBottom = insets.bottom + 32.
     *    This is the ONLY thing that matters: the last pixel of the card is always
     *    insets.bottom + 32 px above the bottom of the screen, which is above the
     *    Android nav bar (gesture strip ~20 px, 3-button bar ~48 px) or iOS home
     *    indicator (~34 px).
     *  - The Snackbar uses insets.bottom as its `bottom` base, so it also
     *    always floats above the nav bar.
     */
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            /**
             * paddingBottom = insets.bottom + 32
             * Keeps last element above the Android nav bar / iOS home indicator.
             * On devices without either (insets.bottom === 0) it defaults to 32.
             */
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
          overScrollMode="never"
        >

          {/* ═══════════ HEADER ═══════════ */}
          <LinearGradient
            colors={[PALETTE.plum, PALETTE.plumMid, PALETTE.plumLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.header,
              /**
               * paddingTop = insets.top + 20
               * Pushes brand content below the status bar / notch.
               * Works on both Android (StatusBar.currentHeight equiv.) and iOS notch.
               */
              { paddingTop: insets.top + 20 },
            ]}
          >
            {/* Ambient floating orbs */}
            <FloatingOrb style={{ top: 20, right: -24 }}  color={PALETTE.rosegold}      size={130} delay={0}    />
            <FloatingOrb style={{ top: 50, left: -36 }}   color={PALETTE.rosegoldLight}  size={90}  delay={600}  />
            <FloatingOrb style={{ bottom: 0, right: 60 }} color={PALETTE.plumLight}      size={110} delay={1200} />

            {/* Logo mark */}
            <Animated.View
              style={[
                styles.logoWrapper,
                { transform: [{ scale: logoScale }, { rotate: logoRotateDeg }], opacity: headerOpacity },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.05)']}
                style={styles.logoCircle}
              >
                <View style={styles.logoInner}>
                  <Ionicons name="sparkles" size={36} color={PALETTE.rosegoldLight} />
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Brand name */}
            <Animated.View
              style={{ transform: [{ translateY: headerSlide }], opacity: headerOpacity, alignItems: 'center' }}
            >
              <Text style={styles.brandName}>Bhagyoday Parlour</Text>
              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.tagline}>Welcome Back</Text>
                <View style={styles.taglineLine} />
              </View>
            </Animated.View>
          </LinearGradient>

          {/* ═══════════ CARD ═══════════ */}
          <Animated.View
            style={[styles.card, { transform: [{ translateY: cardSlide }], opacity: cardOpacity }]}
          >
            {/* Step content with slide transition */}
            <Animated.View style={{ opacity: stepOpacity, transform: [{ translateY: stepSlide }] }}>

              {/* Step badge */}
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{step === 'email' ? '01' : '02'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>
                    {step === 'email' ? 'Sign In' : 'Verify Identity'}
                  </Text>
                  <Text style={styles.stepSubtitle} numberOfLines={1}>
                    {step === 'email'
                      ? 'Enter your email to receive a code'
                      : `Code sent to ${email}`}
                  </Text>
                </View>
              </View>

              {step === 'email' ? (
                <>
                  <AnimatedInput
                    label="Email Address"
                    value={email}
                    onChangeText={t => { setEmail(t); if (emailError) validateEmail(t); }}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={emailError}
                    icon="mail-outline"
                  />
                  <PrimaryButton onPress={handleSendOtp} loading={loading} label="Send Login Code" />
                </>
              ) : (
                <>
                  <AnimatedInput
                    label="6-Digit OTP"
                    value={otp}
                    onChangeText={t => { setOtp(t); if (otpError) validateOtp(t); }}
                    placeholder="••••••"
                    keyboardType="number-pad"
                    maxLength={6}
                    error={otpError}
                    icon="keypad-outline"
                  />
                  <OtpDots value={otp} />
                  <PrimaryButton onPress={handleVerifyOtp} loading={loading} label="Verify & Sign In" />
                  <TouchableOpacity style={styles.backLink} onPress={handleBackToEmail} disabled={loading}>
                    <Ionicons name="arrow-back" size={15} color={PALETTE.textMid} />
                    <Text style={styles.backLinkText}>Use a different email</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>

            {/* OR divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              style={styles.googleBtn} onPress={handleGoogleLogin}
              disabled={loading} activeOpacity={0.85}
            >
              <View style={styles.googleIconBox}>
                <Image source={require('../assets/google.png')} style={styles.googleIcon} />
              </View>
              <Text style={styles.googleLabel}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Footer */}
            <Text style={styles.footerNote}>
              By signing in you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text>
              {' & '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>
          <View style={{height: 200}}/>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Link Modal — rendered outside the scroll tree so it overlays everything */}
      <GoogleLinkModal
        visible={showGoogleLinkModal}
        loading={loading}
        onGoBack={() => setShowGoogleLinkModal(false)}
        onContinueOtp={() => {
          setShowGoogleLinkModal(false);
          setLinkGoogleAccount(true);
          transitionToStep('otp');
          showSnack('OTP sent! Check your email.', 'success');
        }}
      />

      {/*
       * Snackbar — absolutely positioned outside the KAV + ScrollView.
       * bottomOffset = insets.bottom ensures it always clears the nav bar.
       */}
      <Snackbar
        visible={snack.visible}
        message={snack.message}
        type={snack.type}
        onHide={hideSnack}
        bottomOffset={insets.bottom}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    /**
     * cream background shows between the header bottom and the card
     * and fills the area below the card on tall screens — no gaps.
     */
    backgroundColor: PALETTE.cream,
  },

  kav: { flex: 1 },

  scroll: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    // paddingBottom injected inline (insets.bottom + 32)
  },

  // ─ Header
  header: {
    /**
     * No fixed height — let content define it.
     * paddingBottom gives the card enough room to overlap.
     */
    paddingBottom: 60,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    // paddingTop injected inline (insets.top + 20)
  },

  logoWrapper: { marginBottom: 18 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoInner: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(201,149,106,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  brandName: {
    fontSize: 26, fontWeight: '800', color: PALETTE.warmWhite,
    letterSpacing: 0.8, textAlign: 'center',
  },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 },
  taglineLine: { height: 1, width: 32, backgroundColor: PALETTE.rosegoldLight + '80' },
  tagline: {
    fontSize: 13, color: PALETTE.rosegoldLight,
    letterSpacing: 2, fontWeight: '500', textTransform: 'uppercase',
  },

  // ─ Card
  card: {
    backgroundColor: PALETTE.warmWhite,
    borderRadius: 28,
    padding: 24,
    marginHorizontal: 16,
    marginTop: -28,     // overlap with header bottom
    shadowColor: '#1A0E26',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12, shadowRadius: 32, elevation: 10,
  },

  // ─ Step header
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  stepBadge: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: PALETTE.rosegold + '18',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: PALETTE.rosegold + '30',
  },
  stepBadgeText: { fontSize: 13, fontWeight: '800', color: PALETTE.rosegold, letterSpacing: 0.5 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: PALETTE.textDark, letterSpacing: 0.2 },
  stepSubtitle: { fontSize: 13, color: PALETTE.textMid, marginTop: 2 },

  backLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14,
  },
  backLinkText: { fontSize: 14, color: PALETTE.textMid, fontWeight: '500' },

  // ─ Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: PALETTE.border },
  dividerLabel: { fontSize: 12, color: PALETTE.textLight, fontWeight: '500', letterSpacing: 0.5 },

  // ─ Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PALETTE.cream,
    borderRadius: 16, height: 58,
    borderWidth: 1.5, borderColor: PALETTE.border, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  googleIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: PALETTE.warmWhite,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  googleIcon: { width: 22, height: 22, resizeMode: 'contain' },
  googleLabel: { fontSize: 15, fontWeight: '700', color: PALETTE.textDark, letterSpacing: 0.2 },

  // ─ Footer
  footerNote: { fontSize: 12, color: PALETTE.textLight, textAlign: 'center', marginTop: 20, lineHeight: 18 },
  footerLink: { color: PALETTE.rosegold, fontWeight: '600', textDecorationLine: 'underline' },
});