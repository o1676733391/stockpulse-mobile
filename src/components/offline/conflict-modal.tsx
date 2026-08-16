import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOffline } from '@/context/OfflineContext';
import { ConflictRecord } from '@/types/offline';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function ConflictResolutionModal() {
  const { conflicts, resolveConflict } = useOffline();
  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);

  if (conflicts.length === 0) return null;

  const active = selectedConflict ?? conflicts[0];

  const handleResolve = async (strategy: 'client_wins' | 'server_wins') => {
    if (!active) return;
    await resolveConflict(active.id, strategy);
    setSelectedConflict(null);
  };

  return (
    <Modal visible={conflicts.length > 0} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <VectorIcon name="AlertTriangle" size={20} color={Colors.critical.main} />
              <Text style={styles.modalTitle}>Sync Conflict Resolution</Text>
            </View>
            <Badge variant="red">{conflicts.length} Pending</Badge>
          </View>

          <Text style={styles.reasonText}>{active.conflictReason}</Text>

          <ScrollView style={styles.diffScroll}>
            {/* Target Item Name */}
            <Card style={styles.entityCard}>
              <Text style={styles.entityNameText}>{active.entityName}</Text>
              <Text style={styles.entityTypeText}>Entity: {active.entity.toUpperCase()}</Text>
            </Card>

            {/* Side-by-side Diff Comparison */}
            <View style={styles.diffGrid}>
              {/* Local Floor Version */}
              <Card style={[styles.versionCard, styles.clientCard]}>
                <View style={styles.versionHeader}>
                  <Badge variant="blue">Local (Floor Count)</Badge>
                  <Text style={styles.versionSub}>Offline Device</Text>
                </View>

                <View style={styles.payloadBox}>
                  <Text style={styles.payloadText}>
                    {JSON.stringify(active.clientPayload, null, 2)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleResolve('client_wins')}
                  style={({ pressed }) => [styles.applyBtn, styles.applyClientBtn, pressed && styles.pressed]}
                >
                  <VectorIcon name="Check" size={14} color="#ffffff" strokeWidth={3} />
                  <Text style={styles.applyClientBtnText}>Apply Local Count</Text>
                </Pressable>
              </Card>

              {/* Cloud Server Version */}
              <Card style={[styles.versionCard, styles.serverCard]}>
                <View style={styles.versionHeader}>
                  <Badge variant="amber">Cloud (POS Server)</Badge>
                  <Text style={styles.versionSub}>Interim Sale</Text>
                </View>

                <View style={styles.payloadBox}>
                  <Text style={styles.payloadText}>
                    {JSON.stringify(active.serverPayload, null, 2)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleResolve('server_wins')}
                  style={({ pressed }) => [styles.applyBtn, styles.applyServerBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.applyServerBtnText}>Accept Cloud Value</Text>
                </Pressable>
              </Card>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.neutral.card,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
    gap: Spacing.md,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral.borderLight,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  reasonText: {
    fontSize: 12,
    color: Colors.critical.dark,
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    lineHeight: 16,
  },
  diffScroll: {
    maxHeight: 380,
  },
  entityCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  entityNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  entityTypeText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  diffGrid: {
    gap: Spacing.sm,
  },
  versionCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  clientCard: {
    borderColor: Colors.brand.primary,
    borderWidth: 1,
  },
  serverCard: {
    borderColor: Colors.warning.main,
    borderWidth: 1,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionSub: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  payloadBox: {
    backgroundColor: Colors.neutral.surface,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    maxHeight: 90,
  },
  payloadText: {
    ...Typography.monoValue,
    fontSize: 10,
    color: Colors.neutral.textPrimary,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  applyClientBtn: {
    backgroundColor: Colors.brand.primary,
  },
  applyClientBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  applyServerBtn: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
  },
  applyServerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  pressed: {
    opacity: 0.8,
  },
});
