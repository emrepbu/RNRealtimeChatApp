import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeInRight } from 'react-native-reanimated';
import { db } from '../../../utils';
import { id } from '@instantdb/react-native';
import { Theme } from '../../constants/theme';

export function HomeScreen() {
    const router = useRouter();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const { user } = db.useAuth();

    // Query channels and user profile (for avatar)
    const { isLoading, data, error } = db.useQuery({
        channels: {},
        profiles: user ? { $: { where: { 'user.id': user.id } }, avatar: {} } : null
    });

    const userProfile = data?.profiles?.[0];

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        setIsCreating(true);
        try {
            await db.transact(
                db.tx.channels[id()].update({
                    name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
                })
            );
            setNewChannelName('');
            setIsModalVisible(false);
        } catch (err) {
            console.error("Failed to create channel:", err);
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Error: {error.message}</Text>
            </View>
        );
    }

    const renderChannel = ({ item, index }: { item: any; index: number }) => (
        <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
            <Pressable
                onPress={() => router.push(`/${item.name}`)}
                style={({ pressed }) => [
                    styles.channelCard,
                    pressed && styles.channelPressed
                ]}
            >
                <View style={styles.channelRow}>
                    <View style={styles.channelIcon}>
                        <Text style={styles.channelHash}>#</Text>
                    </View>
                    <View style={styles.channelInfo}>
                        <Text style={styles.channelName}>{item.name}</Text>
                        <Text style={styles.channelDetails}>Join the conversation</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Theme.colors.lightGray} />
                </View>
            </Pressable>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <BlurView intensity={80} style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.userName}>{userProfile?.displayName || 'User'}</Text>
                    </View>
                    <Pressable
                        onPress={() => router.push('/profile')}
                        style={({ pressed }) => [
                            styles.profileButton,
                            pressed && styles.channelPressed
                        ]}
                    >
                        {userProfile?.avatar?.url ? (
                            <Image source={{ uri: userProfile.avatar.url }} style={styles.avatar} />
                        ) : (
                            <Ionicons name="person-circle" size={44} color={Theme.colors.primary} />
                        )}
                        <View style={styles.onlineBadge} />
                    </Pressable>
                </View>
            </BlurView>

            <FlatList
                data={data?.channels || []}
                keyExtractor={(item) => item.id}
                renderItem={renderChannel}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Channels</Text>
                        <Pressable 
                            onPress={() => setIsModalVisible(true)}
                            style={({ pressed }) => [
                                styles.addChannelButton,
                                pressed && styles.buttonPressed
                            ]}
                        >
                            <Ionicons name="add-circle" size={24} color={Theme.colors.primary} />
                            <Text style={styles.addChannelText}>New</Text>
                        </Pressable>
                    </View>
                )}
            />

            {/* Create Channel Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <BlurView intensity={100} tint="light" style={styles.modalOverlay}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New Channel</Text>
                            <Pressable onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Theme.colors.text} />
                            </Pressable>
                        </View>
                        
                        <Text style={styles.modalLabel}>Channel Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. general, help..."
                            placeholderTextColor={Theme.colors.placeholder}
                            value={newChannelName}
                            onChangeText={setNewChannelName}
                            autoFocus
                            autoCapitalize="none"
                        />
                        
                        <Pressable 
                            onPress={handleCreateChannel}
                            disabled={!newChannelName.trim() || isCreating}
                            style={({ pressed }) => [
                                styles.createButton,
                                (!newChannelName.trim() || isCreating) && styles.createButtonDisabled,
                                pressed && styles.buttonPressed
                            ]}
                        >
                            {isCreating ? (
                                <ActivityIndicator color={Theme.colors.white} />
                            ) : (
                                <Text style={styles.createButtonText}>Create Channel</Text>
                            )}
                        </Pressable>
                    </KeyboardAvoidingView>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: Theme.colors.error,
        fontSize: Theme.typography.sizes.body,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 60,
        paddingBottom: 20,
        paddingHorizontal: Theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: Theme.typography.sizes.body,
        color: Theme.colors.subtext,
    },
    userName: {
        fontSize: Theme.typography.sizes.title - 4,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.text,
    },
    profileButton: {
        position: 'relative',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: Theme.colors.white,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Theme.colors.success,
        borderWidth: 2,
        borderColor: Theme.colors.white,
    },
    listContent: {
        padding: Theme.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.md,
        marginTop: Theme.spacing.md,
    },
    sectionTitle: {
        fontSize: Theme.typography.sizes.header,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.text,
    },
    addChannelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 122, 255, 0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addChannelText: {
        marginLeft: 4,
        color: Theme.colors.primary,
        fontWeight: Theme.typography.weights.semibold,
        fontSize: Theme.typography.sizes.body - 2,
    },
    channelCard: {
        marginBottom: Theme.spacing.md,
        borderRadius: Theme.radius.lg,
        backgroundColor: Theme.colors.white,
        ...Theme.shadows.small,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    channelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
    },
    channelIcon: {
        width: 48,
        height: 48,
        borderRadius: Theme.radius.md,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    channelHash: {
        fontSize: Theme.typography.sizes.header,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.primary,
    },
    channelInfo: {
        flex: 1,
        marginLeft: Theme.spacing.md,
    },
    channelName: {
        fontSize: Theme.typography.sizes.body + 1,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.text,
    },
    channelDetails: {
        fontSize: Theme.typography.sizes.caption,
        color: Theme.colors.subtext,
        marginTop: 2,
    },
    channelPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    buttonPressed: {
        transform: [{ scale: 0.95 }],
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Theme.colors.white,
        borderTopLeftRadius: Theme.radius.xl,
        borderTopRightRadius: Theme.radius.xl,
        padding: Theme.spacing.xl,
        ...Theme.shadows.large,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
    },
    modalTitle: {
        fontSize: Theme.typography.sizes.header,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.text,
    },
    modalLabel: {
        fontSize: Theme.typography.sizes.caption,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.subtext,
        marginBottom: Theme.spacing.xs,
        marginLeft: 4,
    },
    modalInput: {
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.radius.lg,
        padding: Theme.spacing.md,
        fontSize: Theme.typography.sizes.body,
        color: Theme.colors.text,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: Theme.spacing.xl,
    },
    createButton: {
        backgroundColor: Theme.colors.primary,
        padding: Theme.spacing.md + 2,
        borderRadius: Theme.radius.lg,
        alignItems: 'center',
        ...Theme.shadows.small,
    },
    createButtonDisabled: {
        backgroundColor: Theme.colors.lightGray,
        opacity: 0.6,
    },
    createButtonText: {
        color: Theme.colors.white,
        fontWeight: Theme.typography.weights.bold,
        fontSize: Theme.typography.sizes.body,
    },
});