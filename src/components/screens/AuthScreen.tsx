import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { db } from '../../../utils';
import { Theme } from '../../constants/theme';

export function AuthScreen() {
    const [sentEmail, setSentEmail] = useState('');

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Background Decorative Elements */}
            <Animated.View entering={FadeIn} style={styles.backgroundInner}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
            </Animated.View>

            <Animated.View
                entering={FadeInDown.duration(850)}
                style={styles.cardWrapper}
                renderToHardwareTextureAndroid={Platform.OS === 'android'}
            >
                <View
                    style={styles.cardContainer}
                    renderToHardwareTextureAndroid={Platform.OS === 'android'}
                >
                    <BlurView intensity={Theme.glass.intensity} style={styles.card}>
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <LottieView
                                    source={require('../../../assets/message_bubble.json')}
                                    autoPlay
                                    loop
                                    style={{ width: 100, height: 100 }}
                                />
                            </View>
                            <Text style={styles.title}>InstantChat</Text>
                            <Text style={styles.subtitle}>Connect in real-time</Text>
                        </View>

                        <View style={styles.formContainer}>
                            {!sentEmail ? (
                                <Animated.View entering={FadeIn} exiting={FadeOut}>
                                    <EmailStep onSendEmail={setSentEmail} />
                                </Animated.View>
                            ) : (
                                <Animated.View entering={FadeIn} exiting={FadeOut}>
                                    <CodeStep
                                        sentEmail={sentEmail}
                                        onReset={() => setSentEmail('')}
                                    />
                                </Animated.View>
                            )}
                        </View>
                    </BlurView>
                </View>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Built with InstantDB</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

// --- Email Step ---
interface EmailStepProps {
    onSendEmail: (email: string) => void;
}
function EmailStep({ onSendEmail }: EmailStepProps) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMagicCode = async () => {
        if (!email.trim() || !email.includes('@')) {
            alert('Please enter a valid email');
            return;
        }
        setIsLoading(true);
        try {
            await db.auth.sendMagicCode({ email: email.trim() });
            onSendEmail(email.trim());
        } catch (err: any) {
            alert('Error: ' + (err.body?.message || 'Something went wrong'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Theme.colors.subtext} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={Theme.colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <Pressable
                onPress={handleSendMagicCode}
                disabled={isLoading}
                style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                    isLoading && styles.buttonDisabled
                ]}
            >
                {isLoading ? (
                    <ActivityIndicator color={Theme.colors.white} />
                ) : (
                    <>
                        <Text style={styles.buttonText}>Send Magic Code</Text>
                        <Ionicons name="sparkles" size={18} color={Theme.colors.white} style={styles.buttonIcon} />
                    </>
                )}
            </Pressable>

            <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
            </View>

            <Pressable
                onPress={() => db.auth.signInAsGuest()}
                style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed
                ]}
            >
                <Ionicons name="person-outline" size={20} color={Theme.colors.primary} />
                <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
            </Pressable>
        </View>
    );
}

// --- Code Step ---
interface CodeStepProps {
    sentEmail: string;
    onReset: () => void;
}
function CodeStep({ sentEmail, onReset }: CodeStepProps) {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerifyCode = async () => {
        if (!code.trim() || code.length < 6) {
            alert('Please enter the 6-digit code');
            return;
        }
        setIsLoading(true);
        try {
            await db.auth.signInWithMagicCode({ email: sentEmail, code: code.trim() });
        } catch (err: any) {
            alert('Error: ' + (err.body?.message || 'Invalid code'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            <Text style={styles.infoText}>
                We sent a 6-digit code to{"\n"}
                <Text style={styles.emailText}>{sentEmail}</Text>
            </Text>

            <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color={Theme.colors.subtext} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { letterSpacing: 4 }]}
                    placeholder="Enter Code"
                    placeholderTextColor={Theme.colors.placeholder}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                />
            </View>

            <Pressable
                onPress={handleVerifyCode}
                disabled={isLoading}
                style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                    isLoading && styles.buttonDisabled
                ]}
            >
                {isLoading ? (
                    <ActivityIndicator color={Theme.colors.white} />
                ) : (
                    <Text style={styles.buttonText}>Verify & Sign In</Text>
                )}
            </Pressable>

            <Pressable onPress={onReset} style={styles.backButton}>
                <Text style={styles.backButtonText}>Use different email</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    backgroundInner: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
    },
    circle1: {
        top: -100,
        right: -50,
        width: 300,
        height: 300,
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
    },
    circle2: {
        bottom: -50,
        left: -50,
        width: 250,
        height: 250,
        backgroundColor: 'rgba(0, 122, 255, 0.03)',
    },
    cardWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: Theme.radius.xxl,
        backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.8)' : Theme.colors.white,
        ...Theme.shadows.medium,
    },
    card: {
        padding: Theme.spacing.xl,
        borderRadius: Theme.radius.xxl,
        borderWidth: 1,
        borderColor: Platform.OS === 'ios' ? Theme.glass.borderColor : Theme.colors.border,
        overflow: 'hidden',
    },
    header: {
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
    },
    logoContainer: {
        width: 110,
        height: 110,
        borderRadius: Theme.radius.xl,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.spacing.md,
    },
    title: {
        fontSize: Theme.typography.sizes.title,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.text,
        marginBottom: Theme.spacing.xs,
    },
    subtitle: {
        fontSize: Theme.typography.sizes.body,
        color: Theme.colors.subtext,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.radius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        paddingHorizontal: Theme.spacing.md,
        marginBottom: Theme.spacing.md,
        height: 56,
    },
    inputIcon: {
        marginRight: Theme.spacing.md,
    },
    input: {
        flex: 1,
        fontSize: Theme.typography.sizes.body + 1,
        color: Theme.colors.text,
    },
    primaryButton: {
        flexDirection: 'row',
        width: '100%',
        height: 56,
        backgroundColor: Theme.colors.primary,
        borderRadius: Theme.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.primary,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
    },
    buttonText: {
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.header,
        fontWeight: Theme.typography.weights.semibold,
    },
    buttonIcon: {
        marginLeft: Theme.spacing.sm,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Theme.spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Theme.colors.divider,
    },
    dividerText: {
        paddingHorizontal: Theme.spacing.md,
        color: Theme.colors.lightGray,
        fontSize: Theme.typography.sizes.caption - 2,
        fontWeight: Theme.typography.weights.bold,
    },
    secondaryButton: {
        flexDirection: 'row',
        width: '100%',
        height: 56,
        backgroundColor: 'transparent',
        borderRadius: Theme.radius.lg,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 122, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: Theme.colors.primary,
        fontSize: Theme.typography.sizes.body + 1,
        fontWeight: Theme.typography.weights.semibold,
        marginLeft: Theme.spacing.sm,
    },
    infoText: {
        fontSize: Theme.typography.sizes.body - 1,
        color: Theme.colors.subtext,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Theme.spacing.lg,
    },
    emailText: {
        color: Theme.colors.text,
        fontWeight: Theme.typography.weights.semibold,
    },
    backButton: {
        marginTop: Theme.spacing.md,
        alignItems: 'center',
    },
    backButtonText: {
        color: Theme.colors.subtext,
        fontSize: Theme.typography.sizes.caption,
        textDecorationLine: 'underline',
    },
    footer: {
        paddingVertical: Theme.spacing.lg,
        alignItems: 'center',
    },
    footerText: {
        fontSize: Theme.typography.sizes.caption - 2,
        color: Theme.colors.lightGray,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});