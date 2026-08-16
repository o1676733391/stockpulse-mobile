import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useOffline } from '@/context/OfflineContext';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function OfflineBanner() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    conflictCount,
    toggleNetworkMode,
    syncNow,
  } = useOffline();

  // If online and nothing pending/conflicted, render a minimal subtle status pill
  if (isOnline && pendingCount === 0 && conflictCount === 0 && !isSyncing) {
    return null;
  }

  let bannerBg: string = Colors.brand.subtle;
  let borderColor: string = Colors.brand.light;
  let textColor: string = Colors.brand.dark;
  let iconName = 'Wifi';
  let message = 'Online · All mutations synced';

  if (!isOnline) {
    bannerBg = Colors.warning.subtle;
    borderColor = Colors.warning.light;
    textColor = Colors.warning.dark;
    iconName = 'WifiOff';
    message = `Offline Mode · ${pendingCount} change${pendingCount !== 1 ? 's' : ''} queued locally`;
  } else if (isSyncing) {
    bannerBg = Colors.info.subtle;
    borderColor = Colors.info.light;
    textColor = Colors.info.dark;
    iconName = 'RefreshCw';
    message = `Syncing changes (${pendingCount} pending)...`;
  } else if (conflictCount > 0) {
    bannerBg = Colors.critical.subtle;
    borderColor = Colors.critical.light;
    textColor = Colors.critical.dark;
    iconName = 'AlertTriangle';
    message = `${conflictCount} sync conflict${conflictCount !== 1 ? 's' : ''} detected`;
  }

  return (
    <View style={[styles.container, { backgroundColor: bannerBg, borderColor }]}>
      <View style={styles.leftRow}>
        <VectorIcon name={iconName} size={14} color={textColor} />
        <Text style={[styles.messageText, { color: textColor }]}>{message}</Text>
      </View>

      <View style={styles.actionsRow}>
        {isOnline && pendingCount > 0 && !isSyncing && (
          <Pressable
            onPress={syncNow}
            style={({ pressed }) => [styles.actionPill, pressed && styles.pressed]}
          >
            <Text style={styles.actionPillText}>Sync Now</Text>
          </Pressable>
        )}

        <Pressable
          onPress={toggleNetworkMode}
          style={({ pressed }) => [styles.togglePill, pressed && styles.pressed]}
        >
          <Text style={styles.togglePillText}>
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    zIndex: 999,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  messageText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.md,
    ...Shadows.card,
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  togglePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.md,
  },
  togglePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
});
