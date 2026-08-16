import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [flash, setFlash] = useState(false);
  const isIOS = Platform.OS === 'ios';

  const handleCapture = () => {
    router.push('/scan/processing' as any);
  };

  return (
    <View style={styles.screen}>
      {/* ── Simulated Camera Viewfinder Area ── */}
      <View style={styles.viewfinderContainer}>
        {/* Document Target Frame */}
        <View style={styles.frameWrapper}>
          {/* 4 Corner Target Marks */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Target Grid Lines */}
          <View style={styles.gridContainer} pointerEvents="none">
            <View style={[styles.gridH, { top: '33%' }]} />
            <View style={[styles.gridH, { top: '66%' }]} />
            <View style={[styles.gridV, { left: '33%' }]} />
            <View style={[styles.gridV, { left: '66%' }]} />
          </View>

          {/* Receipt Silhouette Lines */}
          <View style={styles.receiptSilhouette} pointerEvents="none">
            <View style={[styles.receiptLine, { width: '75%' }]} />
            <View style={[styles.receiptLine, { width: '95%' }]} />
            <View style={[styles.receiptLine, { width: '80%' }]} />
            <View style={[styles.receiptLine, { width: '90%' }]} />
            <View style={[styles.receiptLine, { width: '70%' }]} />
            <View style={[styles.receiptLine, { width: '60%' }]} />
          </View>
        </View>

        {/* Viewfinder Guidance Text */}
        <Text style={styles.guidanceText}>
          Position the entire POS report inside the frame
        </Text>
      </View>

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
          <Text style={styles.cancelText}>{isIOS ? 'Cancel' : ''}</Text>
        </Pressable>

        <Text style={styles.topTitle}>Scan POS Report</Text>

        <Pressable
          onPress={() => setFlash(!flash)}
          style={({ pressed }) => [
            styles.flashBtn,
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
          {/* Gallery Button */}
          <Pressable
            onPress={handleCapture}
            style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}
          >
            <View style={styles.sideIconBox}>
              <VectorIcon name="Image" size={20} color="#ffffff" />
            </View>
            <Text style={styles.sideControlLabel}>Gallery</Text>
          </Pressable>

          {/* Shutter Button */}
          <Pressable
            onPress={handleCapture}
            style={({ pressed }) => [styles.shutterRing, pressed && styles.shutterPressed]}
          >
            <View style={styles.shutterCore} />
          </Pressable>

          {/* AI OCR Badge */}
          <View style={styles.sideControl}>
            <View style={styles.aiBadgeBox}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
            <Text style={styles.sideControlLabel}>OCR</Text>
          </View>
        </View>

        {/* Tip Text */}
        <Text style={styles.tipText}>
          Supports multi-column · Low-light · Rotated documents
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090d16',
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
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    zIndex: 10,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 60,
  },
  cancelText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  topTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  flashBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnActive: {
    backgroundColor: '#fbbf24',
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  frameWrapper: {
    width: 270,
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.brand.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
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
    backgroundColor: Colors.brand.primary,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.brand.primary,
  },
  receiptSilhouette: {
    width: 200,
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: 'space-around',
    opacity: 0.35,
  },
  receiptLine: {
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  guidanceText: {
    marginTop: Spacing.xl,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 18,
  },
  bottomControls: {
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  sideControl: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  sideIconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideControlLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  shutterRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: {
    transform: [{ scale: 0.93 }],
  },
  shutterCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
  aiBadgeBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(5, 150, 105, 0.25)',
    borderColor: 'rgba(5, 150, 105, 0.5)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34d399',
  },
  tipText: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  pressed: {
    opacity: 0.8,
  },
});
