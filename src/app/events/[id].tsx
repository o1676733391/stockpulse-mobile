import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { eventService } from '@/services/eventService';
import { CateringEvent, EventStatus } from '@/types/events';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EventDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatCurrency } = useI18n();

  const [event, setEvent] = useState<CateringEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await eventService.getEventById(id);
        setEvent(data);
      } catch {
        // safe fallback
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  const handlePushToPOQ = () => {
    Alert.alert(
      'Shortages Transferred to POQ',
      'The calculated event ingredient shortages have been added to your purchase order recommendations.',
      [
        {
          text: 'Open Order Form (POQ)',
          onPress: () => router.push('/orders/poq' as any),
        },
        { text: 'Done', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>{t('events.emptyState')}</Text>
        <Button label={t('common.goBack')} variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const getStatusBadge = (status: EventStatus): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'upcoming':
        return { label: t('events.upcoming'), variant: 'blue' };
      case 'in_prep':
        return { label: t('events.inPrep'), variant: 'amber' };
      case 'completed':
        return { label: t('events.completed'), variant: 'green' };
      case 'cancelled':
        return { label: t('common.cancelled', { defaultValue: 'Storniert' }), variant: 'red' };
      default:
        return { label: status, variant: 'gray' };
    }
  };

  const statusBadge = getStatusBadge(event.status);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title={event.title}
        subtitle={`${event.guestCount} ${t('events.guestCount')} · ${event.date}`}
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Overview Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventLocation}>{event.location}</Text>
            </View>

            <Badge variant={statusBadge.variant}>
              {statusBadge.label}
            </Badge>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date & Time</Text>
              <Text style={styles.metaValue}>{event.date} at {event.time}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Guest Headcount</Text>
              <Text style={styles.metaValue}>{event.guestCount} Persons</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Organizer / Contact</Text>
              <Text style={styles.metaValue}>{event.contactPerson}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Est. Food Cost</Text>
              <Text style={[styles.metaValue, { color: Colors.brand.primary }]}>
                {formatCurrency(event.totalEstimatedCost)}
              </Text>
            </View>
          </View>

          {event.notes && (
            <View style={styles.notesBox}>
              <VectorIcon name="Info" size={14} color={Colors.neutral.textSecondary} />
              <Text style={styles.notesText}>{event.notes}</Text>
            </View>
          )}
        </Card>

        {/* Shortage Alert Banner */}
        {event.hasShortage && (
          <View style={styles.shortageBannerCard}>
            <View style={styles.shortageIconCircle}>
              <VectorIcon name="AlertTriangle" size={20} color={Colors.critical.main} />
            </View>
            <View style={styles.shortageInfo}>
              <Text style={styles.shortageTitle}>Ingredient Shortage Detected</Text>
              <Text style={styles.shortageSub}>
                {event.shortageCount} items needed for this event exceed current stock. Est. reorder cost: {formatCurrency(event.totalShortageCost)}.
              </Text>
            </View>
          </View>
        )}

        {/* Courses & Menus Section */}
        <Text style={styles.sectionHeading}>
          Event Menus ({event.menuItems.length} courses)
        </Text>

        <Card style={styles.menusCard}>
          {event.menuItems.map((item, idx) => (
            <View
              key={item.recipeId}
              style={[
                styles.menuRow,
                idx !== event.menuItems.length - 1 && styles.menuRowBorder,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.menuName}>{item.recipeName}</Text>
                <Text style={styles.menuSub}>
                  {item.category} · {formatCurrency(item.costPerServing)} per portion
                </Text>
              </View>

              <View style={styles.menuPortionBox}>
                <Text style={styles.menuPortions}>{item.portionCount}</Text>
                <Text style={styles.menuPortionsLabel}>Portions</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* BOM Explosion Ingredient Requirements */}
        <Text style={styles.sectionHeading}>
          BOM Raw Materials & Stock Reconciliation
        </Text>

        <Card style={styles.ingredientsCard}>
          {event.ingredientRequirements.map((req, idx) => {
            const isShort = req.shortageQty > 0;

            return (
              <View
                key={req.itemId}
                style={[
                  styles.ingRow,
                  idx !== event.ingredientRequirements.length - 1 && styles.ingRowBorder,
                ]}
              >
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <Text style={styles.ingName}>{req.itemName}</Text>
                  <Text style={styles.ingSupplier}>
                    {req.supplierName || 'Preferred Supplier'}
                  </Text>
                  <Text style={styles.ingCalc}>
                    Required: <Text style={styles.bold}>{req.requiredQty} {req.unit}</Text> · On-Hand: {req.currentStock} {req.unit}
                  </Text>
                </View>

                <View style={styles.shortageBadgeContainer}>
                  {isShort ? (
                    <View style={styles.shortBadge}>
                      <Text style={styles.shortBadgeText}>
                        Short: {req.shortageQty} {req.unit}
                      </Text>
                      <Text style={styles.shortCostText}>
                        ≈ {formatCurrency(req.shortageCost)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.coveredBadge}>
                      <VectorIcon name="Check" size={12} color="#15803d" />
                      <Text style={styles.coveredBadgeText}>Stock Covered</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {event.hasShortage && (
            <Button
              label="Push Shortages to Order Quantity Form (POQ)"
              variant="primary"
              size="md"
              icon="ShoppingCart"
              fullWidth
              onPress={handlePushToPOQ}
              style={{ marginBottom: Spacing.sm }}
            />
          )}

          <Button
            label={t('events.allEvents')}
            variant="outline"
            size="md"
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.critical.main,
    marginBottom: Spacing.md,
  },
  content: {
    padding: Spacing.md,
  },
  headerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  eventTitle: {
    ...Typography.titleLarge,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  eventLocation: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  metaItem: {
    minWidth: '45%',
  },
  metaLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
    marginBottom: 2,
  },
  metaValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  notesBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  notesText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    flex: 1,
  },
  shortageBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  shortageIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  shortageInfo: {
    flex: 1,
  },
  shortageTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.critical.main,
  },
  shortageSub: {
    ...Typography.bodySmall,
    color: '#991b1b',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeading: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.sm,
  },
  menusCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  menuName: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  menuSub: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  menuPortionBox: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  menuPortions: {
    ...Typography.bodyMedium,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  menuPortionsLabel: {
    ...Typography.labelSmall,
    fontSize: 9,
    color: Colors.neutral.textTertiary,
  },
  ingredientsCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  ingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  ingName: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  ingSupplier: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  ingCalc: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: 3,
  },
  bold: {
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  shortageBadgeContainer: {
    alignItems: 'flex-end',
  },
  shortBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignItems: 'flex-end',
  },
  shortBadgeText: {
    ...Typography.labelSmall,
    color: Colors.critical.dark,
    fontWeight: '700',
  },
  shortCostText: {
    fontSize: 10,
    color: '#991b1b',
  },
  coveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  coveredBadgeText: {
    ...Typography.labelSmall,
    color: '#047857',
    fontWeight: '700',
  },
  actionsContainer: {
    marginTop: Spacing.sm,
  },
});
