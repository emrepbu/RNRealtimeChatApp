import schema from "@/instant.schema";
import { init } from "@instantdb/react-native";

// ID for app: RNRealtimeChatApp
const APP_ID = process.env.EXPO_PUBLIC_INSTANT_APP_ID;

if (!APP_ID) {
    throw new Error('InstantDB App ID is not defined');
}

// Varsayılan AsyncStorage kullanımına geri dön
export const db = init({
    appId: APP_ID,
    schema: schema,
});
