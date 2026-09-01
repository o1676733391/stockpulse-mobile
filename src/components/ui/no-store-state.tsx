import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export interface NoStoreStateProps {
  title?: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}

export function NoStoreState({ title, description, style }: NoStoreStateProps) {
  const router = useRouter();
  const { t } = useI18n();

  const heading = title || t('onboarding.noStoreSelected');
  const subtext = description || t('onboarding.noStoreDesc');

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.iconCircle}>
        <VectorIcon name="Store" size={32} color={Colors.brand.primary} strokeWidth={2.2} />
      </View>

      <Text style={styles.title}>{heading}</Text>
      <Text style={styles.description}>{subtext}</Text>

      <View style={styles.actionsRow}>
        <Button
          label={t('onboarding.joinStore')}
          variant="primary"
          onPress={() => router.push('/store/join' as any)}
          leftIcon={<VectorIcon name="KeyRound" size={16} color="#ffffff" />}
          style={{ flex: 1 }}
        />
        <Button
          label={t('onboarding.createStore')}
          variant="outline"
          onPress={() => router.push('/onboarding' as any)}
          leftIcon={<VectorIcon name="Building" size={16} color={Colors.brand.primary} />}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.neutral.borderLight,
    backgroundColor: '#ffffff',
    ...Shadows.card,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: Spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
});
