import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountDisabledScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TopBar title={t('common.status')} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCircle}>
          <VectorIcon name="ShieldAlert" size={44} color={Colors.critical.main} />
        </View>

        <Text style={styles.heading}>Account Deactivated</Text>

        <Text style={styles.subheading}>
          Your StockPulse account has been deactivated by an organization administrator. Access to restaurant inventory, purchasing, and POS reports is restricted.
        </Text>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account:</Text>
            <Text style={styles.infoValue}>{user?.email || 'User Account'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { color: Colors.critical.main }]}>Deactivated</Text>
          </View>
        </Card>

        <View style={styles.noticeCard}>
          <VectorIcon name="Info" size={20} color={Colors.info.main} />
          <Text style={styles.noticeText}>
            If you believe this is a mistake, please contact your store manager or system administrator to reactivate your credentials.
          </Text>
        </View>

        <Button
          label="Sign Out"
          variant="outline"
          size="lg"
          fullWidth
          onPress={handleLogout}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
  },
  scrollContent: {
    padding: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.critical.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.critical.main,
  },
  heading: {
    ...Typography.pageTitle,
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subheading: {
    ...Typography.body,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  infoCard: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...Typography.bodySecondary,
  },
  infoValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.neutral.card,
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: Spacing.xl,
  },
  noticeText: {
    ...Typography.caption,
    color: Colors.neutral.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
