import { useUser } from "@clerk/clerk-expo";
import { Redirect, useNavigation, useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
  const { user, isLoaded } = useUser();
  const rootNavigationState = useRootNavigationState();
  const navigation = useNavigation();

  useEffect(() => {
    CheckNavLoaded();
    navigation.setOptions({
      headerShown: false
    });
  }, []);

  const CheckNavLoaded = () => {
    if (!rootNavigationState?.key) return null;
  };

  // Wait for auth to load
  if (!isLoaded || !rootNavigationState?.key) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      {user ? (
        <Redirect href={'/(tabs)/home'} />
      ) : (
        <Redirect href={'/login'} />
      )}
    </View>
  );
}