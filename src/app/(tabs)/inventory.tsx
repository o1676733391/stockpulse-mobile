import { DesktopAccessNotice } from '@/components/ui/desktop-access-notice';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryHubScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const router = useRouter();

  const menuItems = [
    {
      id: 'inventory',
      title: t('inventoryHub.cards.stockItemsTitle'),
      description: t('inventoryHub.cards.stockItemsSub'),
      icon: 'Package',
      route: '/inventory/overview',
    },
    {
      id: 'recipes',
      title: t('inventoryHub.cards.recipesTitle'),
      description: t('inventoryHub.cards.recipesSub'),
      icon: 'UtensilsCrossed',
      route: '/recipes',
    },
    {
      id: 'invoices',
      title: t('inventoryHub.cards.invoicesTitle'),
      description: t('inventoryHub.cards.invoicesSub'),
      icon: 'FileText',
      route: '/invoices',
    },
    {
      id: 'loss-logs',
      title: t('inventoryHub.cards.lossLogsTitle'),
      description: t('inventoryHub.cards.lossLogsSub'),
      icon: 'Trash2',
      route: '/loss-logs',
    },
    {
      id: 'delivery-notes',
      title: t('inventoryHub.cards.deliveryNotesTitle'),
      description: t('inventoryHub.cards.deliveryNotesSub'),
      icon: 'Truck',
      route: '/delivery-notes',
    },
    {
      id: 'events',
      title: t('inventoryHub.cards.eventsTitle'),
      description: t('inventoryHub.cards.eventsSub'),
      icon: 'Calendar',
      route: '/events',
    },
  ];

  return (
    <View style={styles.container}>
      <TopBar
        title={t('inventoryHub.title')}
        subtitle={t('inventoryHub.subtitle')}
        large
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Manager Desktop / PC Notice */}
        <DesktopAccessNotice />

        {menuItems.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.iconContainer}>
              <VectorIcon name={item.icon as any} size={26} color={Colors.brand.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
            <VectorIcon name="ChevronRight" size={22} color={Colors.neutral.textTertiary} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.card,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadows.card,
  },
  menuItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    lineHeight: 18,
  },
});
