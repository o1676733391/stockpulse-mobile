import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : Spacing.sm;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.neutral.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.neutral.card,
          borderTopColor: Colors.neutral.borderLight,
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          ...Shadows.card,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <VectorIcon
              name="Home"
              size={22}
              color={color as string}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, focused }) => (
            <VectorIcon
              name="Package"
              size={22}
              color={color as string}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.elevatedScanButton,
                {
                  backgroundColor: focused
                    ? Colors.brand.dark
                    : Colors.brand.primary,
                },
              ]}
            >
              <VectorIcon name="ScanLine" size={22} color="#ffffff" strokeWidth={2.2} />
            </View>
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.scanLabel, { color: color as string }]}>Scan</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <VectorIcon
              name="ShoppingCart"
              size={22}
              color={color as string}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <VectorIcon
              name="MoreHorizontal"
              size={22}
              color={color as string}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  elevatedScanButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    ...Shadows.elevated,
  },
  scanLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
