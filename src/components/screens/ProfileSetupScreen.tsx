import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { id } from "@instantdb/react-native";
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
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
    View
} from "react-native";
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { db } from "../../../utils";
import { Theme } from '../../constants/theme';

export function ProfileSetupScreen() {
    const [name, setName] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = db.useAuth();

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to set a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !user) return;
        setIsSubmitting(true);

        try {
            const profileId = id();
            // 1. Create Profile
            await db.transact(
                db.tx.profiles[profileId].update({
                    displayName: name.trim(),
                }).link({ user: user.id })
            );

            // 2. Handle Image Upload if selected
            if (selectedImage) {
                try {
                    // Optimize
                    const optimized = await ImageManipulator.manipulateAsync(
                        selectedImage,
                        [{ resize: { width: 400, height: 400 } }],
                        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                    );

                    // Standard React Native File Object workaround for Blobs
                    const fileObj = {
                        uri: Platform.OS === 'android' ? optimized.uri : optimized.uri.replace('file://', ''),
                        name: `avatar-${Date.now()}.jpg`,
                        type: 'image/jpeg',
                    };

                    const fileName = `avatars/${user.id}-${Date.now()}.jpg`;

                    // Upload (casting to any since SDK expects Blob)
                    const { data } = await db.storage.uploadFile(fileName, fileObj as any);

                    // Link
                    await db.transact(
                        db.tx.profiles[profileId].link({ avatar: data.id })
                    );
                } catch (imgError) {
                    console.error("Image upload failed during onboarding:", imgError);
                    // We don't block the user if only the image fails
                }
            }
        } catch (error) {
            console.error("Failed to create profile:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Animated.View entering={FadeIn} style={styles.backgroundInner}>
                <View style={styles.circle1} />
                <View style={styles.circle2} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.content}>
                <View style={styles.iconContainer}>
                    <Pressable onPress={handlePickImage}>
                        <View style={styles.avatarPlaceholder}>
                            {selectedImage ? (
                                <Image source={{ uri: selectedImage }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person-circle" size={90} color={Theme.colors.primary} />
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={16} color={Theme.colors.white} />
                            </View>
                        </View>
                    </Pressable>
                </View>

                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Let's set up your profile</Text>

                <View style={styles.inputWrapper}>
                    <BlurView intensity={Theme.glass.intensity} style={styles.blurInput}>
                        <TextInput
                            style={styles.input}
                            placeholder="Your Display Name"
                            placeholderTextColor={Theme.colors.placeholder}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                            maxLength={25}
                        />
                    </BlurView>
                </View>

                <Pressable
                    onPress={handleSubmit}
                    disabled={!name.trim() || isSubmitting}
                    style={({ pressed }) => [
                        styles.button,
                        (!name.trim() || isSubmitting) && styles.buttonDisabled,
                        pressed && styles.buttonPressed
                    ]}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={Theme.colors.white} />
                    ) : (
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>Get Started</Text>
                            <Ionicons name="arrow-forward" size={20} color={Theme.colors.white} style={styles.buttonIcon} />
                        </View>
                    )}
                </Pressable>

                <Text style={styles.footerText}>You can change this later in settings.</Text>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundInner: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    circle1: {
        position: 'absolute',
        top: -100,
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
    },
    circle2: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(0, 122, 255, 0.03)',
    },
    content: {
        width: '85%',
        alignItems: 'center',
        padding: Theme.spacing.xxl,
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.radius.xxl,
        ...Theme.shadows.medium,
    },
    iconContainer: {
        marginBottom: Theme.spacing.lg,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    editBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: Theme.colors.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.colors.white,
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
        textAlign: 'center',
        marginBottom: Theme.spacing.xl,
    },
    inputWrapper: {
        width: '100%',
        marginBottom: Theme.spacing.lg,
    },
    blurInput: {
        borderRadius: Theme.radius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: 'hidden',
    },
    input: {
        height: 56,
        paddingHorizontal: Theme.spacing.md,
        fontSize: Theme.typography.sizes.header,
        color: Theme.colors.text,
        textAlign: 'center',
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: Theme.colors.primary,
        borderRadius: Theme.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.primary,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: Theme.colors.lightGray,
        shadowOpacity: 0,
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
    footerText: {
        marginTop: Theme.spacing.lg,
        fontSize: Theme.typography.sizes.caption - 2,
        color: Theme.colors.lightGray,
    },
});
