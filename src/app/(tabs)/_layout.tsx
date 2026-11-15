import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
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
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
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
          title: t('navigation.inventory'),
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
          title: t('navigation.scan'),
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
            <Text style={[styles.scanLabel, { color: color as string }]}>
              {t('navigation.scan')}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('navigation.orders'),
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
          title: t('navigation.more'),
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
