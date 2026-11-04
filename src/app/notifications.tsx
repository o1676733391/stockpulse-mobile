import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import {
  NOTIFICATION_TYPE_CONFIG,
  notificationService,
  localizeNotification,
} from '@/services/notificationService';
import { AppNotification, NotificationFilter } from '@/types/notification';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function groupByDay(notifs: AppNotification[]) {
  const groups: Record<string, AppNotification[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  notifs.forEach((n) => {
    const notifDate = n.timestamp ? new Date(n.timestamp) : new Date();
    const notifDateStr = notifDate.toDateString();

    if (notifDateStr === todayStr) {
      groups.Today.push(n);
    } else if (notifDateStr === yesterdayStr) {
      groups.Yesterday.push(n);
    } else {
      groups.Earlier.push(n);
    }
  });

  return groups;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const visible = useMemo(() => {
    let list = notifications.filter((n) => !dismissedIds.has(n.id));
    if (filter === 'unread') {
      list = list.filter((n) => !n.read);
    } else if (filter === 'urgent') {
      list = list.filter((n) => n.urgent);
    }
    return list;
  }, [notifications, dismissedIds, filter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && !dismissedIds.has(n.id)).length;
  }, [notifications, dismissedIds]);

  const urgentCount = useMemo(() => {
    return notifications.filter((n) => n.urgent && !dismissedIds.has(n.id)).length;
  }, [notifications, dismissedIds]);

  const grouped = useMemo(() => groupByDay(visible), [visible]);
  const dayOrder = ['Today', 'Yesterday', 'Earlier'] as const;

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (err: any) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await notificationService.dismissNotification(id);
      setDismissedIds((prev) => new Set([...prev, id]));
    } catch (err: any) {
      console.warn('Failed to dismiss notification:', err);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={t('notifications.title')}
        showBack
        right={
          unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAllRead}
              style={({ pressed }) => [styles.markAllReadBtn, pressed && styles.pressed]}
            >
              <Text style={styles.markAllReadBtnText}>{t('notifications.markAllRead')}</Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* ── Filter Bar & Unread Counter ── */}
      <View style={styles.headerBar}>
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setFilter('all')}
            style={[
              styles.filterTab,
              filter === 'all' ? styles.filterTabActive : styles.filterTabInactive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'all' && styles.filterTabTextActive,
              ]}
            >
              {t('common.all')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter('unread')}
            style={[
              styles.filterTab,
              filter === 'unread' ? styles.filterTabActive : styles.filterTabInactive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'unread' && styles.filterTabTextActive,
              ]}
            >
              {t('notifications.filterUnread')}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.tabBadgeGreen}>
                <Text style={styles.tabBadgeTextGreen}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => setFilter('urgent')}
            style={[
              styles.filterTab,
              filter === 'urgent' ? styles.filterTabActive : styles.filterTabInactive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'urgent' && styles.filterTabTextActive,
              ]}
            >
              {t('notifications.filterUrgent')}
            </Text>
            {urgentCount > 0 && (
              <View style={styles.tabBadgeRed}>
                <Text style={styles.tabBadgeTextRed}>{urgentCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {unreadCount > 0 && (
          <View style={styles.unreadStatusBanner}>
            <View style={styles.unreadDot} />
            <Text style={styles.unreadStatusText}>
              {t('notifications.unreadCount', { count: unreadCount })}
            </Text>
            <Pressable
              onPress={handleMarkAllRead}
              style={({ pressed }) => [styles.dismissAllBtn, pressed && styles.pressed]}
            >
              <Text style={styles.dismissAllBtnText}>{t('notifications.markAllRead')}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Error Banner ── */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <VectorIcon name="AlertCircle" size={18} color={Colors.critical.main} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
            <Pressable onPress={fetchNotifs} style={styles.retryBannerBtn}>
              <Text style={styles.retryBannerText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* ── Loading State ── */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        {/* ── Kitchen Alert Center Banner (if urgent alerts present) ── */}
        {!loading && urgentCount > 0 && filter !== 'unread' && (
          <Pressable
            onPress={() => setFilter('urgent')}
            style={styles.alertCenterBanner}
          >
            <View style={styles.alertCenterIconBox}>
              <VectorIcon name="AlertTriangle" size={18} color="#ffffff" />
            </View>
            <View style={styles.alertCenterInfo}>
              <Text style={styles.alertCenterTitle}>
                {t('notifications.title')} · {urgentCount} {t('notifications.filterUrgent')}
              </Text>
              <Text style={styles.alertCenterSub}>
                {t('expiration.urgentAction')}
              </Text>
            </View>
            <VectorIcon name="ChevronRight" size={16} color={Colors.critical.main} />
          </Pressable>
        )}

        {/* ── Empty State ── */}
        {!loading && !errorMsg && visible.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="Bell" size={28} color={Colors.neutral.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>{t('notifications.emptyState')}</Text>
            <Text style={styles.emptySub}>{t('notifications.emptyStateDesc')}</Text>
          </View>
        ) : (
          !loading && dayOrder.map((day) => {
            const items = grouped[day];
            if (!items || items.length === 0) return null;

            const dayLabel =
              day === 'Today'
                ? t('common.today')
                : day === 'Yesterday'
                ? t('common.yesterday')
                : t('common.earlier') || (language === 'de' ? 'Früher' : 'Earlier');

            return (
              <View key={day} style={styles.dayGroup}>
                <Text style={styles.dayHeader}>{dayLabel.toUpperCase()}</Text>

                <View style={styles.itemsStack}>
                  {items.map((n) => {
                    const cfg = NOTIFICATION_TYPE_CONFIG[n.type] ?? NOTIFICATION_TYPE_CONFIG.system_alert;
                    const loc = localizeNotification(n, language);

                    const typeKeyMap: Record<string, string> = {
                      low_stock: 'lowStock',
                      expiring_soon: 'expiringSoon',
                      po_update: 'poStatus',
                      goods_receipt_update: 'goodsReceipt',
                      count_due: 'stockCount',
                      variance: 'variance',
                      expired_items: 'expiringSoon',
                      system_alert: 'system',
                    };
                    const typeKey = typeKeyMap[n.type] || 'system';
                    const badgeLabel = t(`notifications.types.${typeKey}`) || cfg.label;

                    return (
                      <Card
                        key={n.id}
                        onPress={() => router.push(`/notifications/${n.id}` as any)}
                        style={[
                          styles.notifCard,
                          !n.read && styles.notifCardUnread,
                        ]}
                      >
                        {/* Dismiss X button */}
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDismiss(n.id);
                          }}
                          hitSlop={8}
                          style={styles.dismissIconBtn}
                        >
                          <VectorIcon name="X" size={13} color={Colors.neutral.textTertiary} />
                        </Pressable>

                        <View style={styles.notifContentRow}>
                          {/* Unread dot */}
                          {!n.read && <View style={styles.cardUnreadDot} />}

                          {/* Icon Circle */}
                          <View
                            style={[
                              styles.iconBox,
                              { backgroundColor: cfg.bgColor },
                              n.read && { marginLeft: 0 },
                            ]}
                          >
                            <VectorIcon
                              name={cfg.iconName}
                              size={16}
                              color={cfg.iconColor}
                            />
                          </View>

                          <View style={styles.notifMainCol}>
                            {/* Header: Title + Badge */}
                            <View style={styles.titleBadgeRow}>
                              <Text style={styles.notifTitle}>{loc.title}</Text>
                              <Badge variant={cfg.badgeVariant}>{badgeLabel}</Badge>
                            </View>

                            <Text style={styles.notifBody}>{loc.body}</Text>
                            <Text style={styles.notifTime}>{loc.time}</Text>

                            {/* Action Buttons Row */}
                            <View style={styles.actionsRow}>
                              {n.actions?.map((act) => (
                                <Pressable
                                  key={act.label}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    router.push(act.route as any);
                                  }}
                                  style={({ pressed }) => [
                                    styles.actionBtn,
                                    n.urgent ? styles.actionBtnUrgent : styles.actionBtnNormal,
                                    pressed && styles.pressed,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.actionBtnText,
                                      n.urgent
                                        ? styles.actionBtnTextUrgent
                                        : styles.actionBtnTextNormal,
                                    ]}
                                  >
                                    {act.label}
                                  </Text>
                                </Pressable>
                              ))}

                              {!n.read && (
                                <Pressable
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    handleMarkSingleRead(n.id);
                                  }}
                                  style={styles.markReadBtn}
                                >
                                  <Text style={styles.markReadBtnText}>Mark read</Text>
                                </Pressable>
                              )}
                            </View>
                          </View>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  markAllReadBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  markAllReadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  headerBar: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  filterTabActive: {
    backgroundColor: Colors.neutral.textPrimary,
  },
  filterTabInactive: {
    backgroundColor: Colors.neutral.borderLight,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  tabBadgeGreen: {
    backgroundColor: Colors.brand.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeTextGreen: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  tabBadgeRed: {
    backgroundColor: Colors.critical.main,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeTextRed: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  unreadStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand.primary,
  },
  unreadStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  dismissAllBtn: {
    marginLeft: 'auto',
  },
  dismissAllBtnText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    textDecorationLine: 'underline',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  alertCenterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  alertCenterIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.critical.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCenterInfo: {
    flex: 1,
    gap: 2,
  },
  alertCenterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.critical.dark,
  },
  alertCenterSub: {
    fontSize: 11,
    color: Colors.critical.dark,
    lineHeight: 15,
  },
  dayGroup: {
    gap: Spacing.xs,
  },
  dayHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.xs,
    marginBottom: 2,
  },
  itemsStack: {
    gap: Spacing.sm,
  },
  notifCard: {
    padding: Spacing.md,
    position: 'relative',
  },
  notifCardUnread: {
    borderColor: Colors.brand.light,
    borderWidth: 1,
  },
  dismissIconBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 4,
  },
  notifContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  cardUnreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand.primary,
    marginTop: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifMainCol: {
    flex: 1,
    gap: 2,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  notifTitle: {
    ...Typography.cardTitle,
    fontSize: 13,
  },
  notifBody: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actionBtnUrgent: {
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
  },
  actionBtnNormal: {
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnTextUrgent: {
    color: Colors.critical.dark,
  },
  actionBtnTextNormal: {
    color: Colors.brand.dark,
  },
  markReadBtn: {
    marginLeft: 'auto',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  markReadBtnText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  emptySub: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  pressed: {
    opacity: 0.8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.critical.light,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.critical.light,
  },
  errorBannerText: {
    flex: 1,
    ...Typography.body,
    color: Colors.critical.dark,
  },
  retryBannerBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.critical.main,
    borderRadius: Radius.md,
  },
  retryBannerText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySecondary,
  },
});
