import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import {
  INITIAL_NOTIFICATIONS,
  NOTIFICATION_TYPE_CONFIG,
  notificationService,
} from '@/services/notificationService';
import { AppNotification } from '@/types/notification';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [notification, setNotification] = useState<AppNotification>(() => {
    return (
      INITIAL_NOTIFICATIONS.find((n) => n.id === id) ??
      INITIAL_NOTIFICATIONS[0]
    );
  });

  const cfg = useMemo(() => {
    return NOTIFICATION_TYPE_CONFIG[notification.type];
  }, [notification.type]);

  const handleToggleRead = async () => {
    const nextRead = !notification.read;
    if (nextRead) {
      await notificationService.markAsRead(notification.id);
    }
    setNotification((prev) => ({ ...prev, read: nextRead }));
  };

  const handleDismiss = async () => {
    await notificationService.dismissNotification(notification.id);
    router.replace('/notifications' as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title="Notification Detail"
        showBack
        right={
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [styles.dismissTopBtn, pressed && styles.pressed]}
          >
            <Text style={styles.dismissTopBtnText}>Dismiss</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Type Header Card ── */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={[styles.largeIconBox, { backgroundColor: cfg.bgColor }]}>
              <VectorIcon name={cfg.iconName} size={24} color={cfg.iconColor} />
            </View>

            <View style={styles.headerMetaCol}>
              <View style={styles.badgePriorityRow}>
                <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                {notification.urgent && <Badge variant="red">Urgent</Badge>}
              </View>
              <Text style={styles.timeText}>{notification.time}</Text>
            </View>
          </View>

          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationBody}>{notification.body}</Text>
        </Card>

        {/* ── Technical Context & Details ── */}
        {notification.details && (
          <Card style={styles.detailsCard}>
            <View style={styles.detailsTitleRow}>
              <VectorIcon name="Info" size={16} color={Colors.info.main} />
              <Text style={styles.detailsHeading}>Operational Context</Text>
            </View>
            <Text style={styles.detailsBodyText}>{notification.details}</Text>
          </Card>
        )}

        {/* ── Quick Actions Grid ── */}
        {notification.actions && notification.actions.length > 0 && (
          <Card style={styles.actionsCard}>
            <Text style={styles.actionsHeading}>Recommended Actions</Text>
            <View style={styles.actionButtonsCol}>
              {notification.actions.map((act, i) => (
                <Pressable
                  key={act.label}
                  onPress={() => router.push(act.route as any)}
                  style={({ pressed }) => [
                    i === 0 ? styles.primaryActionBtn : styles.secondaryActionBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={
                      i === 0
                        ? styles.primaryActionBtnText
                        : styles.secondaryActionBtnText
                    }
                  >
                    {act.label}
                  </Text>
                  <VectorIcon
                    name="ChevronRight"
                    size={16}
                    color={i === 0 ? '#ffffff' : Colors.neutral.textSecondary}
                  />
                </Pressable>
              ))}
            </View>
          </Card>
        )}

        {/* ── Read Status Toggle ── */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusTitle}>Read Status</Text>
              <Text style={styles.statusSub}>
                {notification.read ? 'Marked as read' : 'Currently marked unread'}
              </Text>
            </View>

            <Pressable
              onPress={handleToggleRead}
              style={({ pressed }) => [styles.toggleReadBtn, pressed && styles.pressed]}
            >
              <Text style={styles.toggleReadBtnText}>
                {notification.read ? 'Mark Unread' : 'Mark Read'}
              </Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>

      {/* ── Fixed Bottom Dismiss ── */}
      <View
        style={[
          styles.fixedBottom,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.md,
          },
        ]}
      >
        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => [styles.bottomDismissBtn, pressed && styles.pressed]}
        >
          <VectorIcon name="Trash2" size={16} color={Colors.critical.main} />
          <Text style={styles.bottomDismissBtnText}>Dismiss Notification</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  dismissTopBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  dismissTopBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.critical.main,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  headerCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  largeIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMetaCol: {
    flex: 1,
    gap: 4,
  },
  badgePriorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  notificationTitle: {
    ...Typography.pageTitle,
    fontSize: 17,
  },
  notificationBody: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    lineHeight: 19,
  },
  detailsCard: {
    padding: Spacing.lg,
    gap: Spacing.xs,
    backgroundColor: Colors.info.subtle,
    borderColor: Colors.info.light,
  },
  detailsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info.dark,
  },
  detailsBodyText: {
    fontSize: 12,
    color: Colors.info.dark,
    lineHeight: 17,
  },
  actionsCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  actionsHeading: {
    ...Typography.sectionHeader,
    fontSize: 11,
  },
  actionButtonsCol: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  statusCard: {
    padding: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    ...Typography.cardTitle,
    fontSize: 13,
  },
  statusSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  toggleReadBtn: {
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  toggleReadBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  fixedBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.neutral.card,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    ...Shadows.elevated,
  },
  bottomDismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
  },
  bottomDismissBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.critical.main,
  },
  pressed: {
    opacity: 0.8,
  },
});
