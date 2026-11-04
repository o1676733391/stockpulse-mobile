import { Button } from '@/components/ui/button';
import { VectorIcon } from '@/components/ui/icons';
import { NoStoreState } from '@/components/ui/no-store-state';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { OcrDocumentType } from '@/types/ocr';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialType?: OcrDocumentType }>();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuth();
  const hasNoStore = !user?.storeId || user.storeId === 'unassigned' || user.storeId === '' || user.storeId === 'pending';
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<OcrDocumentType>(
    params.initialType || 'order_invoice'
  );

  useEffect(() => {
    if (params.initialType && (params.initialType === 'goods_receipt' || params.initialType === 'order_invoice')) {
      setSelectedInvoiceType(params.initialType);
    }
  }, [params.initialType]);
  const cameraRef = useRef<any>(null);
  const isIOS = Platform.OS === 'ios';

  const handleCapture = async () => {
    if (isCapturing) return;

    if (cameraRef.current) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });

        if (photo?.uri) {
          router.push({
            pathname: '/scan/processing',
            params: {
              imageUri: photo.uri,
              documentType: selectedInvoiceType,
            },
          } as any);
          return;
        }
      } catch (err: any) {
        Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
        return;
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        router.push({
          pathname: '/scan/processing',
          params: {
            imageUri: selectedUri,
            documentType: selectedInvoiceType,
          },
        } as any);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to select image from photo library.');
    }
  };

  if (hasNoStore) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: Colors.neutral.background,
            paddingHorizontal: Spacing.lg,
            paddingTop: insets.top + Spacing.xl,
          },
        ]}
      >
        <NoStoreState />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ── Camera Viewfinder or Simulated Overlay ── */}
      {permission?.granted ? (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flash}
          />
          <View style={styles.viewfinderContainer} pointerEvents="box-none">
            {/* Document Target Frame */}
            <View style={styles.frameWrapper}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              <View style={styles.gridContainer} pointerEvents="none">
                <View style={[styles.gridH, { top: '33%' }]} />
                <View style={[styles.gridH, { top: '66%' }]} />
                <View style={[styles.gridV, { left: '33%' }]} />
                <View style={[styles.gridV, { left: '66%' }]} />
              </View>
            </View>

            <Text style={styles.guidanceText}>{t('scan.instructions')}</Text>
          </View>
        </>
      ) : (
        <View style={[styles.viewfinderContainer, styles.permissionFallback]}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <VectorIcon name="Camera" size={36} color={Colors.brand.primary} />
            </View>
            <Text style={styles.permissionHeading}>Camera Access Needed</Text>
            <Text style={styles.permissionSub}>
              StockPulse uses the camera to scan POS daily register receipts and supplier goods receipts with Gemini Vision.
            </Text>
            <Button
              label="Enable Camera"
              variant="primary"
              size="md"
              fullWidth
              onPress={requestPermission}
              style={{ marginBottom: Spacing.sm }}
            />
            <Button
              label="Choose from Gallery"
              variant="outline"
              size="md"
              fullWidth
              onPress={handlePickImage}
            />
          </View>
        </View>
      )}

      {/* ── Top Floating Header Bar ── */}
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top > 0 ? insets.top + Spacing.xs : Spacing.md },
        ]}
      >
        <Pressable
          onPress={() => router.push('/(tabs)' as any)}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
        >
          <VectorIcon
            name={isIOS ? 'ChevronLeft' : 'X'}
            size={isIOS ? 20 : 18}
            color="#ffffff"
            strokeWidth={2.5}
          />
          <Text style={styles.cancelText}>{isIOS ? t('common.cancel') : ''}</Text>
        </Pressable>

        <Text style={styles.topTitle}>{t('scan.title')}</Text>

        <View style={styles.topRightActions}>
          <Pressable
            onPress={() => router.push('/scan/history' as any)}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.pressed,
            ]}
          >
            <VectorIcon
              name="History"
              size={18}
              color="#ffffff"
            />
          </Pressable>

          <Pressable
            onPress={() => setFlash(!flash)}
            style={({ pressed }) => [
              styles.iconBtn,
              flash && styles.flashBtnActive,
              pressed && styles.pressed,
            ]}
          >
            <VectorIcon
              name="Zap"
              size={18}
              color={flash ? '#0f172a' : '#ffffff'}
            />
          </Pressable>
        </View>
      </View>

      {/* ── Floating Invoice Type Selector Bar ── */}
      <View
        style={[
          styles.typeSelectorContainer,
          { top: (insets.top > 0 ? insets.top : 20) + 54 },
        ]}
      >
        <View style={styles.typeSelectorPill}>
          <Pressable
            onPress={() => setSelectedInvoiceType('order_invoice')}
            style={[
              styles.typeTab,
              selectedInvoiceType === 'order_invoice' && styles.typeTabActive,
            ]}
          >
            <VectorIcon
              name="FileText"
              size={14}
              color={selectedInvoiceType === 'order_invoice' ? '#ffffff' : '#94a3b8'}
            />
            <Text
              style={[
                styles.typeTabText,
                selectedInvoiceType === 'order_invoice' && styles.typeTabTextActive,
              ]}
              numberOfLines={1}
            >
              {t('scan.invoiceTypes.orderInvoice')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedInvoiceType('goods_receipt')}
            style={[
              styles.typeTab,
              selectedInvoiceType === 'goods_receipt' && styles.typeTabActive,
            ]}
          >
            <VectorIcon
              name="Truck"
              size={14}
              color={selectedInvoiceType === 'goods_receipt' ? '#ffffff' : '#94a3b8'}
            />
            <Text
              style={[
                styles.typeTabText,
                selectedInvoiceType === 'goods_receipt' && styles.typeTabTextActive,
              ]}
              numberOfLines={1}
            >
              {t('scan.invoiceTypes.goodsReceipt')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.typeHintBadge}>
          <Text style={styles.typeHintText}>
            {selectedInvoiceType === 'order_invoice'
              ? t('scan.invoiceTypes.orderInvoiceDesc')
              : t('scan.invoiceTypes.goodsReceiptDesc')}
          </Text>
        </View>
      </View>

      {/* ── Bottom Controls Bar ── */}
      <View
        style={[
          styles.bottomControls,
          {
            paddingBottom:
              insets.bottom > 0 ? insets.bottom + Spacing.sm : Spacing.xl,
          },
        ]}
      >
        <View style={styles.controlRow}>
          {/* Gallery Picker Button */}
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}
          >
            <View style={styles.sideIconBox}>
              <VectorIcon name="Image" size={20} color="#ffffff" />
            </View>
            <Text style={styles.sideControlLabel}>{t('scan.galleryButton')}</Text>
          </Pressable>

          {/* Shutter Button */}
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            style={({ pressed }) => [styles.shutterRing, pressed && styles.shutterPressed]}
          >
            <View style={[styles.shutterCore, isCapturing && { backgroundColor: Colors.brand.primary }]} />
          </Pressable>

          {/* AI OCR Badge */}
          <View style={styles.sideControl}>
            <View style={styles.aiBadgeBox}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
            <Text style={styles.sideControlLabel}>Gemini</Text>
          </View>
        </View>

        {/* Tip Text */}
        <Text style={styles.bottomTip}>{t('scan.tip')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
  },
  permissionFallback: {
    backgroundColor: '#0f172a',
    paddingTop: 0,
  },
  permissionCard: {
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    ...Shadows.elevated,
  },
  permissionIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  permissionHeading: {
    ...Typography.pageTitle,
    fontSize: 20,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  permissionSub: {
    ...Typography.body,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  frameWrapper: {
    width: 280,
    height: 360,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#10b981',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 6,
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#ffffff',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#ffffff',
  },
  guidanceText: {
    ...Typography.caption,
    color: '#e2e8f0',
    marginTop: Spacing.lg,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 44,
  },
  cancelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  topTitle: {
    ...Typography.cardTitle,
    color: '#ffffff',
    fontSize: 17,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnActive: {
    backgroundColor: '#fbbf24',
  },
  typeSelectorContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9,
    alignItems: 'center',
  },
  typeSelectorPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    maxWidth: 380,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    gap: 6,
  },
  typeTabActive: {
    backgroundColor: Colors.brand.primary,
    ...Shadows.sm,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  typeTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  typeHintBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    maxWidth: '92%',
  },
  typeHintText: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    zIndex: 10,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  sideControl: {
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
  },
  sideIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideControlLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  shutterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#ffffff',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: {
    transform: [{ scale: 0.94 }],
  },
  shutterCore: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#ffffff',
  },
  aiBadgeBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#064e3b',
    borderWidth: 1.5,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
  },
  bottomTip: {
    ...Typography.caption,
    color: '#64748b',
    textAlign: 'center',
    fontSize: 11,
  },
  pressed: {
    opacity: 0.75,
  },
});
