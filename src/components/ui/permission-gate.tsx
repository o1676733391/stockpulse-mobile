import { Button } from '@/components/ui/button';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { Permission } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredPermission?: Permission | Permission[];
  onBack?: () => void;
}

export function AccessDenied({
  title,
  message,
  requiredPermission,
  onBack,
}: AccessDeniedProps) {
  const router = useRouter();
  const { t } = useI18n();

  const handleBack = onBack || (() => router.replace('/(tabs)'));

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <VectorIcon name="ShieldAlert" size={36} color={Colors.critical.main} />
      </View>

      <Text style={styles.title}>
        {title || t('common.accessDenied', { defaultValue: 'Access Restricted' })}
      </Text>

      <Text style={styles.message}>
        {message ||
          t('common.accessDeniedMessage', {
            defaultValue:
              'You do not have the required permissions to view this screen or execute this action.',
          })}
      </Text>

      {requiredPermission && (
        <View style={styles.permissionBadge}>
          <Text style={styles.permissionLabel}>
            {t('common.requiredPermission', { defaultValue: 'Required' })}:{' '}
            <Text style={styles.permissionCode}>
              {Array.isArray(requiredPermission)
                ? requiredPermission.join(' | ')
                : requiredPermission}
            </Text>
          </Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <Button
          label={t('common.returnToDashboard', { defaultValue: 'Return to Dashboard' })}
          variant="primary"
          onPress={handleBack}
        />
      </View>
    </View>
  );
}

export interface PermissionGateProps {
  permission?: Permission;
  anyPermissions?: Permission[];
  allPermissions?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfDenied?: boolean;
}

export function PermissionGate({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback,
  hideIfDenied = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let isAllowed = true;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (anyPermissions && anyPermissions.length > 0) {
    isAllowed = hasAnyPermission(anyPermissions);
  } else if (allPermissions && allPermissions.length > 0) {
    isAllowed = hasAllPermissions(allPermissions);
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (hideIfDenied) {
    return null;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <AccessDenied
      requiredPermission={permission || anyPermissions || allPermissions}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.neutral.surface,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.critical.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.pageTitle,
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: Spacing.lg,
  },
  permissionBadge: {
    backgroundColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xl,
  },
  permissionLabel: {
    ...Typography.caption,
    color: Colors.neutral.textSecondary,
  },
  permissionCode: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.critical.main,
  },
  actionRow: {
    width: '100%',
    maxWidth: 260,
  },
});
