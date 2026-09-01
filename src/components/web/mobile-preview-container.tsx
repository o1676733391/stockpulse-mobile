import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Colors, Spacing, Typography, Radius as BorderRadius } from '@/constants/theme';
import { VectorIcon } from '@/components/ui/icons';

interface MobilePreviewContainerProps {
  children: React.ReactNode;
}

export function MobilePreviewContainer({ children }: MobilePreviewContainerProps) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const { width, height } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width > 560;
  
  const [deviceMode, setDeviceMode] = useState<'phone' | 'max' | 'full'>('phone');
  const [showHelper, setShowHelper] = useState(true);

  // If on actual mobile browser or user toggled full width
  if (!isWideWeb || deviceMode === 'full') {
    return (
      <View style={styles.fullscreenWrapper}>
        {isWideWeb && (
          <View style={styles.floatingControls}>
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => setDeviceMode('phone')}
              activeOpacity={0.8}
            >
              <VectorIcon name="Smartphone" size={14} color="#FFFFFF" />
              <Text style={styles.floatingButtonText}>Switch to Mobile Frame</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.innerContent}>{children}</View>
      </View>
    );
  }

  const phoneWidth = deviceMode === 'phone' ? 402 : 438;
  const phoneMaxHeight = Math.min(874, height - 90);

  return (
    <View style={styles.desktopCanvas}>
      {/* Studio Header Bar */}
      <View style={styles.topToolbar}>
        <View style={styles.brandRow}>
          <View style={styles.appIconBadge}>
            <VectorIcon name="Layers" size={16} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.appTitle}>StockPulse F&B</Text>
              <View style={styles.liveBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveBadgeText}>Mobile Demo</Text>
              </View>
            </View>
            <Text style={styles.appSubtitle}>Inventory & Operations Mobile App</Text>
          </View>
        </View>

        {/* Viewport controls */}
        <View style={styles.controlsGroup}>
          <View style={styles.segmentedPicker}>
            <Pressable
              style={[
                styles.segmentOption,
                deviceMode === 'phone' && styles.segmentOptionActive,
              ]}
              onPress={() => setDeviceMode('phone')}
            >
              <VectorIcon
                name="Smartphone"
                size={13}
                color={deviceMode === 'phone' ? '#FFFFFF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.segmentText,
                  deviceMode === 'phone' && styles.segmentTextActive,
                ]}
              >
                Standard (400px)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentOption,
                deviceMode === 'max' && styles.segmentOptionActive,
              ]}
              onPress={() => setDeviceMode('max')}
            >
              <VectorIcon
                name="Tablet"
                size={13}
                color={deviceMode === 'max' ? '#FFFFFF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.segmentText,
                  deviceMode === 'max' && styles.segmentTextActive,
                ]}
              >
                Plus / Max (438px)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentOption,
                (deviceMode as string) === 'full' && styles.segmentOptionActive,
              ]}
              onPress={() => setDeviceMode('full')}
            >
              <VectorIcon
                name="Maximize2"
                size={13}
                color={(deviceMode as string) === 'full' ? '#FFFFFF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.segmentText,
                  (deviceMode as string) === 'full' && styles.segmentTextActive,
                ]}
              >
                Full Screen
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Studio Area */}
      <View style={styles.studioArea}>
        {/* Device Chassis */}
        <View
          style={[
            styles.phoneChassis,
            {
              width: phoneWidth,
              height: phoneMaxHeight,
            },
          ]}
        >
          {/* Hardware frame bezel accent */}
          <View style={styles.innerBezel}>
            {/* Dynamic Island Pill */}
            <View style={styles.dynamicIslandContainer}>
              <View style={styles.dynamicIsland}>
                <View style={styles.cameraLens} />
                <View style={styles.sensorDot} />
              </View>
            </View>

            {/* Screen Content */}
            <View style={styles.phoneScreen}>
              <View style={styles.screenInner}>{children}</View>
            </View>

            {/* Simulated Home Indicator */}
            <View style={styles.homeIndicatorContainer}>
              <View style={styles.homeIndicatorBar} />
            </View>
          </View>
        </View>
      </View>

      {/* Subtle Footer info */}
      <View style={styles.footerBar}>
        <VectorIcon name="Smartphone" size={14} color="#64748B" />
        <Text style={styles.footerText}>
          On a phone? Opening this link directly gives a 100% full native app experience.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: Colors.neutral.surface,
  },
  innerContent: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  floatingControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 99999,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  desktopCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0A0D14',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topToolbar: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2234',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  appIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0B291B',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34D399',
    textTransform: 'uppercase',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  segmentedPicker: {
    flexDirection: 'row',
    backgroundColor: '#131A29',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  segmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  segmentOptionActive: {
    backgroundColor: '#1E293B',
  },
  segmentText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  studioArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  phoneChassis: {
    backgroundColor: '#161B26',
    borderRadius: 48,
    borderWidth: 10,
    borderColor: '#242B3B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.65,
    shadowRadius: 36,
    position: 'relative',
    overflow: 'hidden',
  },
  innerBezel: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neutral.surface,
    borderRadius: 38,
    overflow: 'hidden',
    position: 'relative',
  },
  dynamicIslandContainer: {
    position: 'absolute',
    top: 9,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  dynamicIsland: {
    width: 110,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
    gap: 6,
  },
  cameraLens: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#081120',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sensorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0F172A',
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neutral.surface,
    position: 'relative',
  },
  screenInner: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  homeIndicatorContainer: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  homeIndicatorBar: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0F172A',
    opacity: 0.35,
  },
  footerBar: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
});
