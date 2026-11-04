import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { eventService } from '@/services/eventService';
import { CateringEvent, EventStatus } from '@/types/events';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EventsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency } = useI18n();

  const [events, setEvents] = useState<CateringEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  // New Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('20 Mar 2026');
  const [newGuests, setNewGuests] = useState('50');
  const [newLocation, setNewLocation] = useState('Main Dining Room');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventService.getEvents();
      setEvents(data);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedTab === 'upcoming' && ev.status === 'completed') return false;
      if (selectedTab === 'completed' && ev.status !== 'completed') return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        ev.contactPerson.toLowerCase().includes(q)
      );
    });
  }, [events, selectedTab, search]);

  const metrics = useMemo(() => {
    const upcomingList = events.filter((e) => e.status !== 'completed');
    const totalGuests = upcomingList.reduce((sum, e) => sum + e.guestCount, 0);
    const shortageEvents = upcomingList.filter((e) => e.hasShortage).length;

    return {
      upcomingCount: upcomingList.length,
      totalGuests,
      shortageEvents,
    };
  }, [events]);

  const handleCreateQuickEvent = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter an event title.');
      return;
    }

    try {
      await eventService.createEvent({
        title: newTitle.trim(),
        date: newDate,
        guestCount: parseInt(newGuests, 10) || 50,
        location: newLocation,
        menuItems: [
          {
            recipeId: 'r1',
            recipeName: 'Menu 1 — Chicken Plate',
            category: 'Main Course',
            portionCount: parseInt(newGuests, 10) || 50,
            costPerServing: 3.42,
          },
        ],
      });

      setShowCreateModal(false);
      setNewTitle('');
      fetchEvents();
      Alert.alert('Event Created', 'Event scheduled and ingredient demand calculated.');
    } catch {
      Alert.alert('Error', 'Unable to schedule event');
    }
  };

  const getStatusBadge = (status: EventStatus): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'upcoming':
        return { label: 'Upcoming', variant: 'blue' };
      case 'in_prep':
        return { label: 'In Preparation', variant: 'amber' };
      case 'completed':
        return { label: 'Completed', variant: 'green' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'red' };
      default:
        return { label: status, variant: 'gray' };
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={t('events.title', { defaultValue: 'Events & Catering' })}
        subtitle={t('events.subtitle', { defaultValue: 'Banquets, event prep & BOM demand forecasting' })}
        showBack
        right={
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Plus" size={14} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.newBtnText}>Plan</Text>
          </Pressable>
        }
      />

      {/* ── Tabs Navigation ── */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          <Pressable
            onPress={() => setSelectedTab('upcoming')}
            style={[styles.tabItem, selectedTab === 'upcoming' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming ({metrics.upcomingCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('all')}
            style={[styles.tabItem, selectedTab === 'all' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              All Events ({events.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('completed')}
            style={[styles.tabItem, selectedTab === 'completed' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
              Past Events ({events.filter((e) => e.status === 'completed').length})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.brand.primary]}
            tintColor={Colors.brand.primary}
          />
        }
      >
        {/* KPI Metrics */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricNum}>{loading ? '--' : metrics.upcomingCount}</Text>
            <Text style={styles.metricLabel}>Upcoming Events</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={[styles.metricNum, { color: Colors.brand.dark }]}>
              {loading ? '--' : metrics.totalGuests}
            </Text>
            <Text style={styles.metricLabel}>Total Guests</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text
              style={[
                styles.metricNum,
                { color: metrics.shortageEvents > 0 ? Colors.critical.main : Colors.neutral.textPrimary },
              ]}
            >
              {loading ? '--' : metrics.shortageEvents}
            </Text>
            <Text style={styles.metricLabel}>Shortage Alerts</Text>
          </Card>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <VectorIcon name="Search" size={16} color={Colors.neutral.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('events.searchPlaceholder', {
              defaultValue: 'Search events by title or location...',
            })}
            placeholderTextColor={Colors.neutral.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* POQ Integration Promo Banner */}
        <Pressable
          onPress={() => router.push('/orders/poq' as any)}
          style={styles.poqBanner}
        >
          <View style={styles.poqIconBox}>
            <VectorIcon name="ShoppingCart" size={20} color={Colors.brand.primary} />
          </View>
          <View style={styles.poqInfo}>
            <Text style={styles.poqTitle}>Order Quantity Form (POQ)</Text>
            <Text style={styles.poqSub}>
              Order ingredients needed for upcoming events and weekly par levels
            </Text>
          </View>
          <VectorIcon name="ChevronRight" size={18} color={Colors.neutral.textTertiary} />
        </Pressable>

        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="Calendar" size={28} color={Colors.neutral.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>
              {t('events.emptyState', { defaultValue: 'No Events Scheduled' })}
            </Text>
            <Text style={styles.emptySub}>
              {t('events.emptyStateDesc', {
                defaultValue: 'Plan catering events and banquets to automatically calculate ingredient prep needs.',
              })}
            </Text>
            <Pressable
              onPress={() => setShowCreateModal(true)}
              style={styles.emptyActionBtn}
            >
              <Text style={styles.emptyActionBtnText}>+ Plan New Event</Text>
            </Pressable>
          </View>
        )}

        {/* Event Cards */}
        {filteredEvents.map((ev) => {
          const statusBadge = getStatusBadge(ev.status);

          return (
            <Card
              key={ev.id}
              style={styles.eventCard}
              onPress={() => router.push(`/events/${ev.id}` as any)}
            >
              {/* Event Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  <Text style={styles.eventLocation}>
                    {ev.location} · {ev.guestCount} Guests
                  </Text>
                </View>

                <Badge variant={statusBadge.variant}>
                  {statusBadge.label}
                </Badge>
              </View>

              {/* Date & Contact Info */}
              <View style={styles.dateRow}>
                <View style={styles.dateChip}>
                  <VectorIcon name="Calendar" size={12} color={Colors.brand.primary} />
                  <Text style={styles.dateChipText}>{ev.date} at {ev.time}</Text>
                </View>

                <Text style={styles.contactText}>Contact: {ev.contactPerson}</Text>
              </View>

              {/* Menu items preview */}
              <View style={styles.menuPreviewRow}>
                <Text style={styles.menuPreviewText}>
                  Menus: {ev.menuItems.map((m) => `${m.portionCount}x ${m.recipeName}`).join(', ')}
                </Text>
              </View>

              {/* Shortage Alert Badge if needed */}
              {ev.hasShortage && (
                <View style={styles.shortageBanner}>
                  <VectorIcon name="AlertTriangle" size={14} color={Colors.critical.main} />
                  <Text style={styles.shortageBannerText}>
                    {ev.shortageCount} ingredients exceed on-hand stock ({formatCurrency(ev.totalShortageCost)} shortage)
                  </Text>
                </View>
              )}

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.costLabel}>
                  Est. Food Cost: <Text style={styles.bold}>{formatCurrency(ev.totalEstimatedCost)}</Text>
                </Text>

                <View style={styles.viewDetailsBtn}>
                  <Text style={styles.viewDetailsText}>View Prep BOM</Text>
                  <VectorIcon name="ChevronRight" size={14} color={Colors.brand.primary} />
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* Plan New Event Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Plan Catering Event</Text>
            <Text style={styles.modalSubtitle}>
              Create a banquet or event to explode BOM ingredient requirements
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Annual Tech Gala Banquet"
                placeholderTextColor={Colors.neutral.textTertiary}
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Date</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 20 Mar 2026"
                placeholderTextColor={Colors.neutral.textTertiary}
                value={newDate}
                onChangeText={setNewDate}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Guests</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="50"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  value={newGuests}
                  onChangeText={setNewGuests}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.inputLabel}>Room / Location</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Main Hall"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  value={newLocation}
                  onChangeText={setNewLocation}
                />
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateQuickEvent}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Schedule & Explode BOM</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    gap: 4,
  },
  newBtnText: {
    ...Typography.labelMedium,
    color: '#ffffff',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  tabContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tabItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.background,
  },
  tabItemActive: {
    backgroundColor: '#dcfce7',
  },
  tabText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  metricNum: {
    ...Typography.titleLarge,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  metricLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...Typography.bodyMedium,
    color: Colors.neutral.textPrimary,
    padding: 0,
  },
  poqBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  poqIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  poqInfo: {
    flex: 1,
  },
  poqTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  poqSub: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontSize: 12,
  },
  loadingBox: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: Spacing.lg,
  },
  emptyActionBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  emptyActionBtnText: {
    ...Typography.labelMedium,
    color: '#ffffff',
    fontWeight: '700',
  },
  eventCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  eventTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  eventLocation: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  dateChipText: {
    fontSize: 11,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  contactText: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
  },
  menuPreviewRow: {
    marginTop: 8,
  },
  menuPreviewText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontSize: 12,
  },
  shortageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: Spacing.xs + 2,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  shortageBannerText: {
    ...Typography.labelSmall,
    color: Colors.critical.dark,
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  costLabel: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    ...Typography.labelSmall,
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalTitle: {
    ...Typography.titleLarge,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inputLabel: {
    ...Typography.labelSmall,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.bodyMedium,
    color: Colors.neutral.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    ...Typography.labelMedium,
    color: Colors.neutral.textSecondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalSaveText: {
    ...Typography.labelMedium,
    color: '#ffffff',
    fontWeight: '700',
  },
});
