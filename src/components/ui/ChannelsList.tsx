import { Ionicons } from '@expo/vector-icons';
import { id } from "@instantdb/react-native";
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { db } from "../../../utils";

export default function ChannelsList() {
    const [newChannelName, setNewChannelName] = useState('');
    const { isLoading, error, data } = db.useQuery({
        channels: {}
    });

    const handleAddChannel = () => {
        if (!newChannelName.trim()) return;

        db.transact(
            db.tx.channels[id()].update({
                name: newChannelName.trim(),
            })
        );
        setNewChannelName('');
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Fetching channels...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>Error: {error.message}</Text>
            </View>
        );
    }

    const renderChannelItem = ({ item, index }: { item: any; index: number }) => (
        <AnimatedItem item={item} index={index} />
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Channels</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{data?.channels.length || 0}</Text>
                </View>
            </View>

            <FlatList
                data={data?.channels}
                renderItem={renderChannelItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Animated.View exiting={FadeIn} style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>No channels found. Be the first to start a conversation!</Text>
                    </Animated.View>
                }
            />

            <View style={styles.inputContainer}>
                <BlurView intensity={30} style={styles.blurInput}>
                    <TextInput
                        style={styles.input}
                        placeholder="Create a new channel..."
                        placeholderTextColor="#999"
                        value={newChannelName}
                        onChangeText={setNewChannelName}
                    />
                    <Pressable
                        onPress={handleAddChannel}
                        disabled={!newChannelName.trim()}
                        style={({ pressed }) => [
                            styles.sendButton,
                            { opacity: newChannelName.trim() ? 1 : 0.5, transform: [{ scale: pressed ? 0.9 : 1 }] }
                        ]}
                    >
                        <Ionicons name="add-circle" size={32} color="#007AFF" />
                    </Pressable>
                </BlurView>
            </View>
        </KeyboardAvoidingView>
    );
}

function AnimatedItem({ item, index }: { item: any; index: number }) {
    const router = useRouter();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={styles.itemWrapper}
        >
            <Animated.View style={animatedStyle}>
                <Pressable
                    onPressIn={() => { scale.value = withSpring(0.96); }}
                    onPressOut={() => { scale.value = withSpring(1); }}
                    onPress={() => {
                        router.push(`/${item.id}`);
                    }}
                    style={styles.itemPressable}
                >
                    <View style={styles.itemIconContainer}>
                        <Text style={styles.itemIconText}>#</Text>
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.channelName}>{item.name}</Text>
                        <Text style={styles.lastMessage}>Tap to join the discussion</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        overflow: 'visible',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
    errorText: {
        marginTop: 10,
        color: '#FF3B30',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    badge: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 20,
        paddingHorizontal: 8, // Gölgelerin kesilmemesi için yanlardan boşluk
    },
    itemWrapper: {
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        overflow: 'visible', // Gölgelerin dışarı taşmasına izin ver
    },
    itemPressable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    itemIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemIconText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    itemTextContainer: {
        flex: 1,
    },
    channelName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    lastMessage: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    inputContainer: {
        paddingTop: 12,
    },
    blurInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#333',
    },
    sendButton: {
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 15,
        marginTop: 16,
        lineHeight: 22,
    },
});