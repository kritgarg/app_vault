import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppTabs from "./AppTabs";
import CardsListScreen from "../screens/CardsListScreen";
import AddCardScreen from "../screens/AddCardScreen";
import CardDetailsScreen from "../screens/CardDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#121214" },
      }}
    >
      <Stack.Screen name="MainTabs" component={AppTabs} />
      <Stack.Screen name="CardsList" component={CardsListScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />
      <Stack.Screen name="CardDetails" component={CardDetailsScreen} />
    </Stack.Navigator>
  );
}
