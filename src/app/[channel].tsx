import { Ionicons } from '@expo/vector-icons';
import { id } from "@instantdb/react-native";
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { 
    Layout, 
    SlideInRight,
    SlideInLeft
} from 'react-native-reanimated';
import { db } from '../../utils';
import { Theme } from '../constants/theme';

export default function ChannelScreen() {
    const params = useLocalSearchParams();
    const channelName = params.channel as string;
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const { user } = db.useAuth();

    // Query channel, messages, and user profile for this channel
    const { isLoading, data } = db.useQuery({
        channels: {
            $: { where: { name: channelName } },
        },
        profiles: user ? { $: { where: { 'user.id': user.id } } } : undefined,
        messages: {
            $: {
                where: { 'channel.name': channelName },
                order: { serverCreatedAt: 'asc' }
            },
            author: { avatar: {} }
        },
    });

    const channel = data?.channels?.[0];
    const userProfile = data?.profiles?.[0];
    const messages = data?.messages || [];

    const handleSend = async () => {
        if (!message.trim() || !user || !channel || !userProfile) return;
        setIsSending(true);
        try {
            await db.transact(
                db.tx.messages[id()].update({
                    content: message.trim(),
                    timestamp: Date.now(), // Still used for UI time strings
                }).link({ 
                    'channel': channel.id,
                    'author': userProfile.id
                })
            );
            setMessage('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.backgroundInner}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
            </View>

            {/* Custom Premium Header */}
            <BlurView intensity={80} style={styles.header}>
                <View style={styles.headerContent}>
                    <Pressable 
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.backButton, pressed && styles.headerButtonPressed]}
                    >
                        <Ionicons name="chevron-back" size={28} color={Theme.colors.text} />
                    </Pressable>
                    <View style={styles.headerInfo}>
                        <Text style={styles.channelPrefix}>#</Text>
                        <Text style={styles.headerTitle}>{channelName}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </BlurView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                style={{ flex: 1 }}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MessageBubble item={item} isMe={item.author?.id === userProfile?.id} />
                    )}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Bar */}
                <BlurView intensity={90} style={styles.inputBar}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor={Theme.colors.placeholder}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                        />
                        <Pressable 
                            onPress={handleSend}
                            disabled={!message.trim() || isSending}
                            style={({ pressed }) => [
                                styles.sendButton,
                                (!message.trim() || isSending) && styles.sendButtonDisabled,
                                pressed && styles.buttonPressed
                            ]}
                        >
                            {isSending ? (
                                <ActivityIndicator size="small" color={Theme.colors.white} />
                            ) : (
                                <Ionicons name="send" size={20} color={Theme.colors.white} />
                            )}
                        </Pressable>
                    </View>
                </BlurView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function MessageBubble({ item, isMe }: { item: any; isMe: boolean }) {
    return (
        <Animated.View 
            entering={isMe ? SlideInRight.springify() : SlideInLeft.springify()}
            layout={Layout.springify()}
            style={[
                styles.messageRow,
                isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }
            ]}
        >
            {!isMe && (
                <View style={styles.avatarContainer}>
                    {item.author?.avatar?.url ? (
                        <Image source={{ uri: item.author.avatar.url }} style={styles.miniAvatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={12} color={Theme.colors.primary} />
                        </View>
                    )}
                </View>
            )}
            <View style={[
                styles.bubble,
                isMe ? styles.myBubble : styles.theirBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    isMe ? styles.myMessageText : styles.theirMessageText
                ]}>
                    {item.content}
                </Text>
                <Text style={[
                    styles.timestamp,
                    isMe ? styles.myTimestamp : styles.theirTimestamp
                ]}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </Animated.View>
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
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    headerButtonPressed: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    channelPrefix: {
        fontSize: Theme.typography.sizes.header,
        color: Theme.colors.primary,
        fontWeight: Theme.typography.weights.bold,
        marginRight: 4,
    },
    headerTitle: {
        fontSize: Theme.typography.sizes.header,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.text,
    },
    listContent: {
        padding: Theme.spacing.md,
        paddingBottom: 20,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: Theme.spacing.md,
        alignItems: 'flex-end',
    },
    avatarContainer: {
        marginRight: Theme.spacing.sm,
        marginBottom: 2,
    },
    miniAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Theme.colors.border,
    },
    avatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,122,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm + 2,
        borderRadius: Theme.radius.lg,
        ...Theme.shadows.small,
    },
    myBubble: {
        backgroundColor: Theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: Theme.colors.white,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    messageText: {
        fontSize: Theme.typography.sizes.body,
        lineHeight: 22,
    },
    myMessageText: {
        color: Theme.colors.white,
    },
    theirMessageText: {
        color: Theme.colors.text,
    },
    timestamp: {
        fontSize: Theme.typography.sizes.tiny - 1,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimestamp: {
        color: Theme.colors.subtext,
    },
    inputBar: {
        paddingTop: Theme.spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
        paddingHorizontal: Theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.radius.xl,
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        fontSize: Theme.typography.sizes.body,
        color: Theme.colors.text,
        paddingTop: Platform.OS === 'ios' ? 8 : 4,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Theme.spacing.sm,
    },
    sendButtonDisabled: {
        backgroundColor: Theme.colors.lightGray,
        opacity: 0.6,
    },
    buttonPressed: {
        transform: [{ scale: 0.92 }],
    },
});
