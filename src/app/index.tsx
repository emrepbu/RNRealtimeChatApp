import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { db } from '../../utils';
import { AuthScreen } from '../components/screens/AuthScreen';
import { HomeScreen } from '../components/screens/HomeScreen';
import { ProfileSetupScreen } from '../components/screens/ProfileSetupScreen';

function App() {
  const { user, isLoading: authLoading } = db.useAuth();

  // Query to check if the user has a profile
  const { data, isLoading: queryLoading } = db.useQuery(
    user ? { profiles: { $: { where: { 'user.id': user.id } } } } : null
  );

  const hasProfile = (data?.profiles?.length ?? 0) > 0;
  const isLoading = authLoading || (user && queryLoading);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!hasProfile) {
    return <ProfileSetupScreen />;
  }

  return <HomeScreen />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});

export default App;