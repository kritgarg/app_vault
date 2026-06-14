import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "../store/useAuthStore";
import AuthStack from "./AuthStack";
import VaultGate from "./VaultGate";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { authClient } from "../../lib/auth-client";

export default function RootNavigator() {
  const { user, isLoading, setUser, setSession, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    async function checkSession() {
      try {
        const { data } = await authClient.getSession();
        if (data && data.user) {
          setUser(data.user);
          setSession(data.session);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [setUser, setSession, setLoading, clearAuth]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <VaultGate /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#121214",
    alignItems: "center",
    justifyContent: "center",
  },
});
