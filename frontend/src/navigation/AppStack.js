import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppTabs from "./AppTabs";
import CardsListScreen from "../screens/CardsListScreen";
import AddCardScreen from "../screens/AddCardScreen";
import CardDetailsScreen from "../screens/CardDetailsScreen";

import PasswordsListScreen from "../screens/PasswordsListScreen";
import AddPasswordScreen from "../screens/AddPasswordScreen";
import PasswordDetailsScreen from "../screens/PasswordDetailsScreen";
import SearchScreen from "../screens/SearchScreen";

import DocumentsListScreen from "../screens/DocumentsListScreen";
import AddDocumentScreen from "../screens/AddDocumentScreen";
import DocumentDetailsScreen from "../screens/DocumentDetailsScreen";
import FavoritesScreen from "../screens/FavoritesScreen";

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
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="CardsList" component={CardsListScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />
      <Stack.Screen name="CardDetails" component={CardDetailsScreen} />
      <Stack.Screen name="PasswordsList" component={PasswordsListScreen} />
      <Stack.Screen name="AddPassword" component={AddPasswordScreen} />
      <Stack.Screen name="PasswordDetails" component={PasswordDetailsScreen} />
      <Stack.Screen name="DocumentsList" component={DocumentsListScreen} />
      <Stack.Screen name="AddDocument" component={AddDocumentScreen} />
      <Stack.Screen name="DocumentDetails" component={DocumentDetailsScreen} />
      <Stack.Screen name="FavoritesScreen" component={FavoritesScreen} />
    </Stack.Navigator>
  );
}
