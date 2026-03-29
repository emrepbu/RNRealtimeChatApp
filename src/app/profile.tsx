import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { id } from "@instantdb/react-native";
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { db } from '../../utils';
import { Theme } from '../constants/theme';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, isLoading: authLoading } = db.useAuth();
    
    // Query profile with avatar
    const { data, isLoading: queryLoading } = db.useQuery(
        user ? { profiles: { $: { where: { 'user.id': user.id } }, avatar: {} } } : null
    );

    const profile = data?.profiles?.[0];
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showSnackbar, setShowSnackbar] = useState(false);

    useEffect(() => {
        if (profile?.displayName) {
            setName(profile.displayName);
        }
    }, [profile]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/');
        }
    }, [user, authLoading]);

    if (authLoading || queryLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
        );
    }

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to change your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            try {
                setIsUploading(true);
                // 1. Optimize
                const optimized = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 400, height: 400 } }],
                    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                );

                // 2. Upload using standard React Native File Object
                await uploadAvatar(optimized.uri);
            } catch (error) {
                console.error("Image processing failed:", error);
                Alert.alert("Error", "Failed to process image.");
                setIsUploading(false);
            }
        }
    };

    const uploadAvatar = async (uri: string) => {
        if (!user || !profile) return;
        try {
            // Standard React Native File Object workaround for Blobs
            // The networking layer recognizes this shape and handles binary streaming.
            const fileObj = {
                uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                name: `avatar-${Date.now()}.jpg`,
                type: 'image/jpeg',
            };

            const fileName = `avatars/${user.id}-${Date.now()}.jpg`;
            
            // Upload file (casting to any since SDK expects Blob, but RN fetch body accepts this object)
            const { data } = await db.storage.uploadFile(fileName, fileObj as any);
            
            // Link file to profile
            await db.transact(
                db.tx.profiles[profile.id].link({ avatar: data.id })
            );
            
            setShowSnackbar(true);
            setTimeout(() => setShowSnackbar(false), 3000);
        } catch (error: any) {
            console.error("Upload failed:", error);
            Alert.alert("Error", "Failed to upload image: " + (error.message || "Unknown error"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !user || !profile) return;
        setIsSaving(true);
        try {
            await db.transact(
                db.tx.profiles[profile.id].update({
                    displayName: name.trim(),
                })
            );
            setShowSnackbar(true);
            setTimeout(() => setShowSnackbar(false), 3000);
        } catch (error) {
            console.error("Failed to update profile:", error);
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Sign Out", 
                    style: "destructive", 
                    onPress: () => {
                        db.auth.signOut();
                        router.replace('/');
                    } 
                }
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.backgroundInner}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={Theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Profile Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
                <View style={styles.avatarContainer}>
                    <Pressable onPress={handlePickImage} disabled={isUploading}>
                        <BlurView intensity={Theme.glass.intensity} style={styles.avatarBlur}>
                            {isUploading ? (
                                <ActivityIndicator color={Theme.colors.primary} />
                            ) : profile?.avatar?.url ? (
                                <Image source={{ uri: profile.avatar.url }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={60} color={Theme.colors.primary} />
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={16} color={Theme.colors.white} />
                            </View>
                        </BlurView>
                    </Pressable>
                </View>

                <Text style={styles.emailText}>{user?.email || 'Guest User'}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Display Name</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="How should we call you?"
                            placeholderTextColor={Theme.colors.placeholder}
                        />
                    </View>
                </View>

                <Pressable
                    onPress={handleSave}
                    disabled={isSaving || !name.trim() || name === profile?.displayName}
                    style={({ pressed }) => [
                        styles.saveButton,
                        (isSaving || !name.trim() || name === profile?.displayName) && styles.buttonDisabled,
                        pressed && styles.buttonPressed
                    ]}
                >
                    {isSaving ? (
                        <ActivityIndicator color={Theme.colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Save Changes</Text>
                    )}
                </Pressable>

                <View style={styles.spacer} />

                <Pressable
                    onPress={handleSignOut}
                    style={({ pressed }) => [
                        styles.signOutButton,
                        pressed && styles.buttonPressed
                    ]}
                >
                    <Ionicons name="log-out-outline" size={20} color={Theme.colors.error} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>
            </Animated.View>

            {/* Premium Snackbar */}
            {showSnackbar && (
                <Animated.View 
                    entering={FadeInDown.springify()} 
                    exiting={FadeOut.duration(500)}
                    style={styles.snackbar}
                >
                    <BlurView intensity={80} style={styles.snackbarBlur}>
                        <Ionicons name="checkmark-circle" size={24} color={Theme.colors.success} />
                        <Text style={styles.snackbarText}>Profile updated successfully!</Text>
                    </BlurView>
                </Animated.View>
            )}
        </KeyboardAvoidingView>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: Theme.colors.white,
        ...Theme.shadows.small,
    },
    headerTitle: {
        fontSize: Theme.typography.sizes.header,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.text,
    },
    content: {
        flex: 1,
        paddingHorizontal: Theme.spacing.lg + 4,
        alignItems: 'center',
    },
    avatarContainer: {
        marginTop: 20,
        marginBottom: Theme.spacing.md,
    },
    avatarBlur: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    editBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: Theme.colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.colors.white,
    },
    emailText: {
        fontSize: Theme.typography.sizes.caption,
        color: Theme.colors.subtext,
        marginBottom: Theme.spacing.xl,
    },
    section: {
        width: '100%',
        marginBottom: Theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: Theme.typography.sizes.caption,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.subtext,
        marginBottom: Theme.spacing.sm,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        width: '100%',
        height: 56,
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: Theme.spacing.md,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    input: {
        fontSize: Theme.typography.sizes.body,
        color: Theme.colors.text,
    },
    saveButton: {
        width: '100%',
        height: 56,
        backgroundColor: Theme.colors.primary,
        borderRadius: Theme.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.primary,
    },
    buttonText: {
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.body,
        fontWeight: Theme.typography.weights.bold,
    },
    buttonDisabled: {
        backgroundColor: Theme.colors.lightGray,
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
    },
    spacer: {
        flex: 1,
    },
    signOutButton: {
        flexDirection: 'row',
        width: '100%',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.2)',
        borderRadius: Theme.radius.lg,
    },
    signOutText: {
        marginLeft: Theme.spacing.sm,
        fontSize: Theme.typography.sizes.body,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.error,
    },
    snackbar: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        zIndex: 1000,
    },
    snackbarBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.xl,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        ...Theme.shadows.medium,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.glass.borderColor,
    },
    snackbarText: {
        marginLeft: Theme.spacing.md,
        fontSize: Theme.typography.sizes.body - 1,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.text,
    },
});
