import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface PermissionRestrictedModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  currentRole?: string;
  requiredRoles?: string[];
}

export function PermissionRestrictedModal({
  visible,
  onClose,
  title,
  message,
  currentRole,
  requiredRoles = ['admin', 'manager'],
}: PermissionRestrictedModalProps) {
  const { t } = useI18n();

  const modalTitle = title || t('settings.permissionDeniedTitle', { defaultValue: 'Permission Restricted' });
  const roleDisplay = currentRole ? currentRole.toUpperCase() : 'AUDITOR';

  const defaultMessage = message || t('settings.permissionDeniedMessage', {
    role: currentRole || 'auditor',
    defaultValue: `User role '${currentRole || 'auditor'}' lacks the required role: [admin, superadmin, manager] to modify store settings.`,
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.card}>
          {/* Top Close X */}
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <VectorIcon name="X" size={18} color={Colors.neutral.textTertiary} />
          </Pressable>

          {/* Icon Circle */}
          <View style={styles.iconCircle}>
            <VectorIcon name="ShieldAlert" size={32} color={Colors.critical.main} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{modalTitle}</Text>

          {/* Message */}
          <Text style={styles.message}>{defaultMessage}</Text>

          {/* Role Comparison Box */}
          <View style={styles.roleBox}>
            <View style={styles.roleCol}>
              <Text style={styles.roleLabel}>YOUR ROLE</Text>
              <Badge variant="amber">{roleDisplay}</Badge>
            </View>

            <View style={styles.arrowCol}>
              <VectorIcon name="ArrowRight" size={14} color={Colors.neutral.textTertiary} />
            </View>

            <View style={styles.roleCol}>
              <Text style={styles.roleLabel}>REQUIRED</Text>
              <View style={styles.badgeRow}>
                {requiredRoles.map((r) => (
                  <Badge key={r} variant="purple">
                    {r.toUpperCase()}
                  </Badge>
                ))}
              </View>
            </View>
          </View>

          {/* Helper Note */}
          <View style={styles.noteBox}>
            <VectorIcon name="Info" size={14} color={Colors.info.main} />
            <Text style={styles.noteText}>
              Store configuration updates affect all staff, inventory rules, and FEFO alerts. Contact an Administrator to request changes.
            </Text>
          </View>

          {/* Action Button */}
          <Button
            label={t('common.understood', { defaultValue: 'Understood' })}
            variant="primary"
            onPress={onClose}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.elevated,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.xs,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.critical.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.critical.light,
  },
  title: {
    ...Typography.cardTitle,
    fontSize: 18,
    textAlign: 'center',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.bodySecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  roleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: Colors.neutral.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
    marginBottom: Spacing.md,
  },
  roleCol: {
    alignItems: 'center',
    gap: 4,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    letterSpacing: 0.5,
  },
  arrowCol: {
    paddingHorizontal: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.info.subtle,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.info.dark,
  },
  actionBtn: {
    width: '100%',
  },
});
