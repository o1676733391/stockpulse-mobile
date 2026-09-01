import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import {
  INITIAL_ARCHIVE_REPORTS,
  INITIAL_REPORT_ITEMS,
  analyticsService,
} from '@/services/analyticsService';
import { ArchiveReport, ReportItem } from '@/types/analytics';
import { openBrowserAsync } from 'expo-web-browser';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTER_OPTIONS: Record<string, string[]> = {
  'Date Range': ['Today', 'Last 7 days', 'Last 30 days', 'Last 3 months', 'Custom'],
  Store:        ['All Stores', 'Bella Cucina Restaurant'],
  Category:     ['All Categories', 'Inventory', 'Variance', 'Waste', 'Receipts', 'Purchasing', 'Audit'],
  Supplier:     ['All Suppliers', 'Metro Foods GmbH', 'FreshProduce GmbH', 'Alpine Dairy Co.'],
};

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [reports] = useState<ReportItem[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_REPORT_ITEMS))
  );
  const [archives] = useState<ArchiveReport[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_ARCHIVE_REPORTS))
  );

  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    'Date Range': 'Last 30 days',
    Store: 'All Stores',
    Category: 'All Categories',
    Supplier: 'All Suppliers',
  });

  const [activeFilterModal, setActiveFilterModal] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set());
  const [generatedUrls, setGeneratedUrls] = useState<Record<string, { pdf?: string; excel?: string }>>({});
  const [downloadingArchive, setDownloadingArchive] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter(
      (r) =>
        filterValues['Category'] === 'All Categories' ||
        r.category === filterValues['Category']
    );
  }, [reports, filterValues]);

  const handleGenerate = async (reportId: string, format: 'pdf' | 'excel') => {
    try {
      setGeneratingId(reportId);
      const res = await analyticsService.generateReport(reportId, format);
      setGeneratedIds((prev) => new Set([...prev, reportId]));
      setGeneratedUrls((prev) => ({
        ...prev,
        [reportId]: {
          ...prev[reportId],
          [format]: res.url,
        },
      }));
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Failed to generate report file');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleViewReport = async (reportId: string, format: 'pdf' | 'excel') => {
    const url = generatedUrls[reportId]?.[format];
    if (url) {
      try {
        if (Platform.OS === 'web') {
          window.open(url, '_blank');
        } else {
          await openBrowserAsync(url);
        }
      } catch {
        Alert.alert('View Error', 'Failed to open report file.');
      }
    } else {
      Alert.alert(
        'Generate Report',
        `This report has not been generated in ${format.toUpperCase()} format yet. Would you like to generate it now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: () => handleGenerate(reportId, format),
          },
        ]
      );
    }
  };

  const handleShareReport = async (report: ReportItem) => {
    const urls = generatedUrls[report.id];
    if (!urls || (!urls.pdf && !urls.excel)) {
      Alert.alert('Share Error', 'No generated files found to share. Please generate a PDF or Excel version first.');
      return;
    }

    let message = `Report: ${report.title}\n`;
    if (urls.pdf) {
      message += `PDF: ${urls.pdf}\n`;
    }
    if (urls.excel) {
      message += `Excel: ${urls.excel}\n`;
    }

    try {
      await Share.share({
        message,
        title: `Share ${report.title}`,
      });
    } catch {
      // Ignore share cancellation / error
    }
  };

  const generateAndShare = async (reportId: string, format: 'pdf' | 'excel') => {
    try {
      let url = generatedUrls[reportId]?.[format];
      if (!url) {
        setGeneratingId(reportId);
        const res = await analyticsService.generateReport(reportId, format);
        setGeneratedIds((prev) => new Set([...prev, reportId]));
        setGeneratedUrls((prev) => ({
          ...prev,
          [reportId]: {
            ...prev[reportId],
            [format]: res.url,
          },
        }));
        url = res.url;
      }

      const report = reports.find((r) => r.id === reportId);
      const title = report ? report.title : 'Report';
      await Share.share({
        message: `Report: ${title}\n${format.toUpperCase()}: ${url}`,
        title: `Share ${title}`,
      });
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Failed to generate report file');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDefaultShare = (report: ReportItem) => {
    Alert.alert(
      'Share Report',
      'Which format would you like to generate and share?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF', onPress: () => generateAndShare(report.id, 'pdf') },
        { text: 'Excel', onPress: () => generateAndShare(report.id, 'excel') },
      ]
    );
  };

  const handleDownloadArchive = async (archive: ArchiveReport) => {
    try {
      setDownloadingArchive(archive.name);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Download Complete',
        `Successfully downloaded "${archive.name}" (${archive.size}).`,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Open',
            onPress: async () => {
              const mockUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
              if (Platform.OS === 'web') {
                window.open(mockUrl, '_blank');
              } else {
                await openBrowserAsync(mockUrl);
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert('Download Error', 'Failed to download report archive.');
    } finally {
      setDownloadingArchive(null);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('analytics.reports')} large showBack />

      {/* ── Filter Bar ── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {Object.keys(FILTER_OPTIONS).map((key) => {
            const isDefault =
              filterValues[key] === FILTER_OPTIONS[key][0];

            return (
              <Pressable
                key={key}
                onPress={() => setActiveFilterModal(key)}
                style={[
                  styles.filterChip,
                  !isDefault ? styles.filterChipActive : styles.filterChipDefault,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !isDefault && styles.filterChipTextActive,
                  ]}
                >
                  {key}: {filterValues[key]}
                </Text>
                <VectorIcon
                  name="ChevronDown"
                  size={12}
                  color={!isDefault ? '#ffffff' : Colors.neutral.textSecondary}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Report Catalog List ── */}
        <View style={styles.catalogSection}>
          <SectionHeader
            title="Available Reports"
            action={`${filteredReports.length} reports`}
          />

          {filteredReports.map((r) => {
            const isGenerating = generatingId === r.id;
            const isDone = generatedIds.has(r.id);

            return (
              <Card key={r.id} style={styles.reportCard}>
                <View style={styles.reportTopRow}>
                  <View style={styles.reportIconBox}>
                    <VectorIcon name={r.iconName} size={20} color={Colors.brand.primary} />
                  </View>

                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{r.title}</Text>
                    <View style={styles.reportMetaRow}>
                      <Badge variant="gray">{r.frequency}</Badge>
                      <Text style={styles.reportLastGen}>Last: {r.lastGenerated}</Text>
                    </View>
                  </View>
                </View>

                {/* Generated State */}
                {isDone ? (
                  <View style={styles.generatedActionsRow}>
                    <View style={styles.generatedPill}>
                      <VectorIcon name="Check" size={14} color={Colors.brand.dark} />
                      <Text style={styles.generatedPillText}>
                        Ready · {filterValues['Date Range']}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleViewReport(r.id, 'pdf')}
                      style={({ pressed }) => [styles.exportActionBtnRed, pressed && styles.pressed]}
                    >
                      <VectorIcon name="FileText" size={14} color="#dc2626" />
                    </Pressable>

                    <Pressable
                      onPress={() => handleViewReport(r.id, 'excel')}
                      style={({ pressed }) => [styles.exportActionBtnGreen, pressed && styles.pressed]}
                    >
                      <VectorIcon name="BarChart2" size={14} color={Colors.brand.dark} />
                    </Pressable>

                    <Pressable
                      onPress={() => handleShareReport(r)}
                      style={({ pressed }) => [styles.exportActionBtnSlate, pressed && styles.pressed]}
                    >
                      <VectorIcon name="Share2" size={14} color={Colors.neutral.textSecondary} />
                    </Pressable>
                  </View>
                ) : isGenerating ? (
                  /* Generating Progress State */
                  <View style={styles.generatingBox}>
                    <ActivityIndicator size="small" color={Colors.brand.primary} />
                    <Text style={styles.generatingText}>Generating report...</Text>
                  </View>
                ) : (
                  /* Default Action Buttons */
                  <View style={styles.actionButtonsRow}>
                    <Pressable
                      onPress={() => handleGenerate(r.id, 'pdf')}
                      style={({ pressed }) => [styles.generatePdfBtn, pressed && styles.pressed]}
                    >
                      <VectorIcon name="Download" size={13} color="#ffffff" />
                      <Text style={styles.generatePdfBtnText}>Generate PDF</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleGenerate(r.id, 'excel')}
                      style={({ pressed }) => [styles.generateExcelBtn, pressed && styles.pressed]}
                    >
                      <VectorIcon name="BarChart2" size={13} color={Colors.neutral.textPrimary} />
                      <Text style={styles.generateExcelBtnText}>Excel</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDefaultShare(r)}
                      style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
                    >
                      <VectorIcon name="Share2" size={14} color={Colors.neutral.textSecondary} />
                    </Pressable>
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        {/* ── Historical Report Archive ── */}
        <View style={styles.archiveSection}>
          <SectionHeader title="Historical Archive" />
          {archives.map((item, i) => (
            <Card key={i} style={styles.archiveCard}>
              <View style={styles.archiveRow}>
                <View style={styles.archiveIconBox}>
                  <VectorIcon name="Archive" size={16} color={Colors.neutral.textSecondary} />
                </View>

                <View style={styles.archiveInfo}>
                  <Text style={styles.archiveName}>{item.name}</Text>
                  <Text style={styles.archiveMeta}>
                    {item.date} · {item.size}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleDownloadArchive(item)}
                  style={({ pressed }) => [styles.archiveDownloadBtn, pressed && styles.pressed]}
                >
                  {downloadingArchive === item.name ? (
                    <ActivityIndicator size="small" color={Colors.neutral.textPrimary} />
                  ) : (
                    <VectorIcon name="Download" size={14} color={Colors.neutral.textPrimary} />
                  )}
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* ── Filter Selection Modal ── */}
      <Modal
        visible={activeFilterModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveFilterModal(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActiveFilterModal(null)}
        >
          <View style={styles.filterModalCard}>
            <Text style={styles.modalFilterTitle}>Select {activeFilterModal}</Text>
            {activeFilterModal &&
              FILTER_OPTIONS[activeFilterModal]?.map((opt) => {
                const isSelected = filterValues[activeFilterModal] === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      setFilterValues((prev) => ({
                        ...prev,
                        [activeFilterModal]: opt,
                      }));
                      setActiveFilterModal(null);
                    }}
                    style={[
                      styles.filterModalOption,
                      isSelected && styles.filterModalOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterModalOptionText,
                        isSelected && styles.filterModalOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && (
                      <VectorIcon name="Check" size={16} color={Colors.brand.primary} strokeWidth={3} />
                    )}
                  </Pressable>
                );
              })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  filterBar: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingVertical: Spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.lg,
  },
  filterChipDefault: {
    backgroundColor: Colors.neutral.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.brand.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  catalogSection: {
    gap: Spacing.sm,
  },
  reportCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  reportTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  reportIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {
    flex: 1,
    gap: 2,
  },
  reportTitle: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  reportLastGen: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  generatePdfBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    ...Shadows.card,
  },
  generatePdfBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  generateExcelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
  },
  generateExcelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.subtle,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  generatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  generatedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  generatedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.subtle,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
  },
  generatedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  exportActionBtnRed: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportActionBtnGreen: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportActionBtnSlate: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveSection: {
    gap: Spacing.xs,
  },
  archiveCard: {
    padding: Spacing.sm,
  },
  archiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  archiveIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveInfo: {
    flex: 1,
  },
  archiveName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  archiveMeta: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  archiveDownloadBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    gap: Spacing.xs,
    ...Shadows.elevated,
  },
  modalFilterTitle: {
    ...Typography.cardTitle,
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  filterModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
  },
  filterModalOptionSelected: {
    backgroundColor: Colors.brand.subtle,
  },
  filterModalOptionText: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  filterModalOptionTextSelected: {
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
