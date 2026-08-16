import { useAuth } from '@/context/AuthContext';
import { Permission, UserRole } from '@/types/rbac';
import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

export interface FeatureGateProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({
  permission,
  fallback = null,
  children,
}: FeatureGateProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export interface RoleGateProps {
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({
  allowedRoles,
  fallback = null,
  children,
}: RoleGateProps) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export interface CostGateProps {
  value?: string | number;
  mask?: string;
  style?: TextStyle;
  children?: React.ReactNode;
}

export function CostGate({
  value,
  mask = '€•••',
  style,
  children,
}: CostGateProps) {
  const { hasPermission } = useAuth();
  const canViewCosts = hasPermission('inventory:view_costs');

  if (!canViewCosts) {
    return <Text style={[styles.maskedText, style]}>{mask}</Text>;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Text style={style}>{value}</Text>;
}

const styles = StyleSheet.create({
  maskedText: {
    letterSpacing: 1.5,
    opacity: 0.7,
  },
});
