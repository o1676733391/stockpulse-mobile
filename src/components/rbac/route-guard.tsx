import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Permission, UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface RouteGuardProps {
  permission?: Permission;
  allowedRoles?: UserRole[];
  title?: string;
  children: React.ReactNode;
}

export function RouteGuard({
  permission,
  allowedRoles,
  title = 'Restricted Access',
  children,
}: RouteGuardProps) {
  const router = useRouter();
  const { hasPermission, role, user } = useAuth();

  let isAllowed = true;

  if (permission && !hasPermission(permission)) {
    isAllowed = false;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    isAllowed = false;
  }

  if (!isAllowed) {
    return (
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
        <TopBar title={title} showBack />
        <View style={styles.content}>
          <Card style={styles.restrictedCard}>
            <View style={styles.iconCircle}>
              <VectorIcon name="ShieldAlert" size={32} color={Colors.critical.main} />
            </View>

            <Text style={styles.cardTitle}>Access Restricted</Text>
            <Text style={styles.cardMessage}>
              Your current role ({role.toUpperCase()}) does not have permission to access this screen or perform this operational action.
            </Text>

            <View style={styles.roleInfoBox}>
              <Text style={styles.roleInfoLabel}>Active User Profile</Text>
              <Text style={styles.roleInfoUser}>{user.name} ({user.email})</Text>
            </View>

            <Pressable
              onPress={() => router.replace('/(tabs)' as any)}
              style={({ pressed }) => [styles.returnBtn, pressed && styles.pressed]}
            >
              <Text style={styles.returnBtnText}>Return to Dashboard</Text>
            </Pressable>
          </Card>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  restrictedCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.critical.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    ...Typography.pageTitle,
    fontSize: 18,
    textAlign: 'center',
  },
  cardMessage: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  roleInfoBox: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: '100%',
    alignItems: 'center',
    gap: 2,
    marginVertical: Spacing.xs,
  },
  roleInfoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    textTransform: 'uppercase',
  },
  roleInfoUser: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  returnBtn: {
    width: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    ...Shadows.card,
  },
  returnBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.8,
  },
});
