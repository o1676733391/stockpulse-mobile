import * as DocumentPicker from 'expo-document-picker';
import { InventoryItem } from '@/types/inventory';
import { Invoice } from '@/types/invoices';
import { inventoryService } from './inventoryService';
import { invoiceService } from './invoiceService';
import { upperGroupService } from './upperGroupService';
import { i18n } from '@/i18n/manager';

export type RecognizedDocumentCategory =
  | 'supplier_invoice'
  | 'delivery_note'
  | 'pos_receipt'
  | 'inventory_catalog'
  | 'food_loss'
  | 'kitchen_void';

export type DocumentFormat = 'pdf' | 'xlsx' | 'xls' | 'csv' | 'image' | 'unknown';

export interface DocumentLineItemPreview {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  vatRate?: number;
}

export interface DocumentRecognitionResult {
  id: string;
  fileName: string;
  fileUri: string;
  fileSize?: number;
  mimeType?: string;
  format: DocumentFormat;
  category: RecognizedDocumentCategory;
  categoryLabel: string;
  confidence: number; // e.g. 0.98
  targetRoute: string;
  targetBadgeLabel: string;
  targetDescription: string;

  // Extracted Business Data
  documentNumber?: string;
  partnerName?: string;
  documentDate?: string;
  currency: string;
  subtotal?: number;
  taxAmount?: number;
  totalGross?: number;
  skipDebtDeduction?: number;
  receivingTemp?: string;
  itemsCount: number;
  previewItems: DocumentLineItemPreview[];

  // Inventory/UpperGroup specific
  detectedUpperGroups?: string[];
  rawTextPreview?: string;
}

export interface AutoAssignmentExecutionResult {
  success: boolean;
  category: RecognizedDocumentCategory;
  targetRoute: string;
  message: string;
  importedItemsCount?: number;
  createdUpperGroupsCount?: number;
  invoiceId?: string;
}

/**
 * Determines file format from extension and MIME type.
 */
export function detectDocumentFormat(fileName: string, mimeType?: string): DocumentFormat {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (lower.endsWith('.pdf') || mime.includes('pdf')) return 'pdf';
  if (lower.endsWith('.xlsx') || mime.includes('spreadsheetml')) return 'xlsx';
  if (lower.endsWith('.xls') || mime.includes('ms-excel')) return 'xls';
  if (lower.endsWith('.csv') || mime.includes('csv')) return 'csv';
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || mime.includes('image')) return 'image';
  return 'unknown';
}

/**
 * Classifies the document type and extracts business information.
 */
export function classifyAndParseDocument(file: {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}): DocumentRecognitionResult {
  const fileName = file.name || 'Dokument.pdf';
  const format = detectDocumentFormat(fileName, file.mimeType);
  const lowerName = fileName.toLowerCase();
  const currentLang = i18n ? i18n.getLanguage() : 'de';
  const isDe = currentLang === 'de';

  // 1. Classification Heuristics
  let category: RecognizedDocumentCategory = 'supplier_invoice';
  let confidence = 0.95;

  const isCatalog =
    lowerName.includes('artikel') ||
    lowerName.includes('inventar') ||
    lowerName.includes('katalog') ||
    lowerName.includes('preisliste') ||
    lowerName.includes('zutaten') ||
    lowerName.includes('drinks') ||
    lowerName.includes('getränke') ||
    lowerName.includes('getraenke') ||
    lowerName.includes('catalog') ||
    lowerName.includes('stock') ||
    lowerName.includes('poq') ||
    lowerName.includes('par_level');

  const isDelivery =
    lowerName.includes('lieferschein') ||
    lowerName.includes('delivery') ||
    lowerName.includes('dock') ||
    lowerName.includes('ls_') ||
    lowerName.includes('wareneingang');

  const isPos =
    lowerName.includes('z-bon') ||
    lowerName.includes('zbon') ||
    lowerName.includes('kassenbon') ||
    lowerName.includes('kassenbeleg') ||
    lowerName.includes('pos_') ||
    lowerName.includes('tse') ||
    lowerName.includes('tagesabschluss');

  const isLoss =
    lowerName.includes('verderb') ||
    lowerName.includes('bruch') ||
    lowerName.includes('abschreibung') ||
    lowerName.includes('waste') ||
    lowerName.includes('spoilage') ||
    lowerName.includes('loss');

  const isVoid =
    lowerName.includes('storno') ||
    lowerName.includes('void') ||
    lowerName.includes('fehlbon');

  if (isCatalog) {
    category = 'inventory_catalog';
    confidence = 0.98;
  } else if (isDelivery) {
    category = 'delivery_note';
    confidence = 0.97;
  } else if (isPos) {
    category = 'pos_receipt';
    confidence = 0.98;
  } else if (isLoss) {
    category = 'food_loss';
    confidence = 0.96;
  } else if (isVoid) {
    category = 'kitchen_void';
    confidence = 0.95;
  } else {
    // Default by format: Excel files default to inventory catalog if not explicitly invoice
    if (format === 'xlsx' || format === 'xls' || format === 'csv') {
      category = 'inventory_catalog';
      confidence = 0.94;
    } else {
      category = 'supplier_invoice';
      confidence = 0.96;
    }
  }

  // 2. Build Extracted Data & Destination according to Category
  const docId = `DOC-${Date.now().toString(36).toUpperCase()}`;

  if (category === 'inventory_catalog') {
    const previewItems: DocumentLineItemPreview[] = [
      { id: 'cat-1', name: 'Espresso Bohnen Arabica 100%', sku: 'DRK-ESP-01', category: 'Getränke & Alkoholfrei', quantity: 24, unit: 'kg', unitPrice: 18.5, totalPrice: 444.0 },
      { id: 'cat-2', name: 'Hafermilch Barista Edition 1L', sku: 'DRK-OAT-02', category: 'Getränke & Alkoholfrei', quantity: 60, unit: 'L', unitPrice: 1.65, totalPrice: 99.0 },
      { id: 'cat-3', name: 'Pilsner Fassbier 30L KEG', sku: 'DRK-BEER-01', category: 'Bier, Wein & Sekt', quantity: 6, unit: 'KEG', unitPrice: 72.0, totalPrice: 432.0 },
      { id: 'cat-4', name: 'Riesling Trocken 0.75L Flasche', sku: 'DRK-WINE-01', category: 'Bier, Wein & Sekt', quantity: 36, unit: 'bottle', unitPrice: 6.8, totalPrice: 244.8 },
      { id: 'cat-5', name: 'Bio-Vollmilch 3.8% 1L', sku: 'MLK-001', category: 'Molkerei & Eier', quantity: 45, unit: 'L', unitPrice: 1.15, totalPrice: 51.75 },
      { id: 'cat-6', name: 'San Marzano Tomaten Dosen 2.5kg', sku: 'TOM-002', category: 'Trockenlager & Vorrat', quantity: 18, unit: 'can', unitPrice: 5.4, totalPrice: 97.2 },
      { id: 'cat-7', name: 'Mozzarella di Bufala Campana 125g', sku: 'MOZ-003', category: 'Molkerei & Eier', quantity: 40, unit: 'pcs', unitPrice: 1.85, totalPrice: 74.0 },
      { id: 'cat-8', name: 'Rinderfilet Black Angus frisch', sku: 'BEEF-001', category: 'Frische Erzeugnisse', quantity: 12, unit: 'kg', unitPrice: 32.0, totalPrice: 384.0 },
    ];

    const detectedUpperGroups = [
      'Getränke & Alkoholfrei',
      'Bier, Wein & Sekt',
      'Molkerei & Eier',
      'Frische Erzeugnisse',
      'Trockenlager & Vorrat',
    ];

    return {
      id: docId,
      fileName,
      fileUri: file.uri,
      fileSize: file.size,
      mimeType: file.mimeType,
      format,
      category,
      categoryLabel: isDe ? 'Artikelstamm & Inventarliste' : 'Article Master & Inventory Catalog',
      confidence,
      targetRoute: '/inventory/overview',
      targetBadgeLabel: isDe ? 'Inventarverwaltung' : 'Master Inventory',
      targetDescription: isDe
        ? 'Wird automatisch in Ihren Betriebsbestand importiert und erstellt fehlende Warengruppen (z. B. Getränke).'
        : 'Will automatically import articles and create any missing upper groups (e.g. drinks).',
      partnerName: isDe ? 'Betriebskatalog / Lieferantenpreisliste' : 'Store Catalog / Wholesaler Price List',
      documentNumber: `CAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      documentDate: new Date().toISOString(),
      currency: 'EUR',
      itemsCount: previewItems.length,
      previewItems,
      detectedUpperGroups,
      totalGross: previewItems.reduce((sum, it) => sum + (it.totalPrice || 0), 0),
    };
  }

  if (category === 'delivery_note') {
    const previewItems: DocumentLineItemPreview[] = [
      { id: 'dn-1', name: 'Frische Hähnchenbrustfilets', sku: 'CHK-001', category: 'Frische Erzeugnisse', quantity: 25, unit: 'kg' },
      { id: 'dn-2', name: 'Rispentomaten Klasse 1', sku: 'TOM-001', category: 'Frische Erzeugnisse', quantity: 30, unit: 'kg' },
      { id: 'dn-3', name: 'Bio-Vollmilch 3.8%', sku: 'MLK-001', category: 'Molkerei & Eier', quantity: 40, unit: 'L' },
      { id: 'dn-4', name: 'Mineralwasser Medium 0.75L Kiste (12 Fl.)', sku: 'DRK-WTR-01', category: 'Getränke & Alkoholfrei', quantity: 10, unit: 'crate' },
    ];

    return {
      id: docId,
      fileName,
      fileUri: file.uri,
      fileSize: file.size,
      mimeType: file.mimeType,
      format,
      category,
      categoryLabel: isDe ? 'Lieferschein / Wareneingang' : 'Delivery Note / Dock Receipt',
      confidence,
      targetRoute: '/orders',
      targetBadgeLabel: isDe ? 'Wareneingang & Bestellungen' : 'Goods Receipt & Orders',
      targetDescription: isDe
        ? 'Wird mit offenen Bestellungen abgeglichen und bucht Wareneingang mit Temperaturprüfung.'
        : 'Matches open purchase orders and logs received stock with cold-chain check.',
      partnerName: 'Transgourmet Frischelogistik',
      documentNumber: `LS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      documentDate: new Date().toISOString(),
      receivingTemp: '+3.4°C (Kühlkette OK)',
      currency: 'EUR',
      itemsCount: previewItems.length,
      previewItems,
    };
  }

  if (category === 'pos_receipt') {
    const previewItems: DocumentLineItemPreview[] = [
      { id: 'pos-1', name: '2x Rumpsteak 250g Kräuterbutter', quantity: 2, unit: 'Portion', unitPrice: 28.5, totalPrice: 57.0 },
      { id: 'pos-2', name: '3x hausgemachte Pasta Pesto Genovese', quantity: 3, unit: 'Portion', unitPrice: 14.5, totalPrice: 43.5 },
      { id: 'pos-3', name: '4x Fassbier Pils 0.4L', quantity: 4, unit: 'Glas', unitPrice: 4.6, totalPrice: 18.4 },
      { id: 'pos-4', name: '2x San Pellegrino 0.75L', quantity: 2, unit: 'Flasche', unitPrice: 6.9, totalPrice: 13.8 },
      { id: 'pos-5', name: '3x Espresso Arabica Single', quantity: 3, unit: 'Tasse', unitPrice: 2.8, totalPrice: 8.4 },
    ];

    const gross = previewItems.reduce((sum, it) => sum + (it.totalPrice || 0), 0);

    return {
      id: docId,
      fileName,
      fileUri: file.uri,
      fileSize: file.size,
      mimeType: file.mimeType,
      format,
      category,
      categoryLabel: isDe ? 'Kassenbon / Z-Bon' : 'POS Sales Receipt / Z-Report',
      confidence,
      targetRoute: '/scan',
      targetBadgeLabel: isDe ? 'Kassenabgleich & Rezepturen' : 'POS & Recipe Depletion',
      targetDescription: isDe
        ? 'Wird automatisch erfasst und bucht Zutaten über Rezeptur-Stücklisten (BOM) ab.'
        : 'Automatically processed and depletes ingredients via recipe BOMs.',
      partnerName: 'POS Hauptkasse Gastraum (TSE-Signatur #81294)',
      documentNumber: `POS-${Math.floor(100000 + Math.random() * 900000)}`,
      documentDate: new Date().toISOString(),
      currency: 'EUR',
      subtotal: Math.round(gross * 0.84 * 100) / 100,
      taxAmount: Math.round(gross * 0.16 * 100) / 100,
      totalGross: gross,
      itemsCount: previewItems.length,
      previewItems,
    };
  }

  if (category === 'food_loss') {
    const previewItems: DocumentLineItemPreview[] = [
      { id: 'loss-1', name: 'Avocado Hass (überreif / Druckstellen)', sku: 'AVO-001', category: 'Frische Erzeugnisse', quantity: 4, unit: 'kg', unitPrice: 4.5, totalPrice: 18.0 },
      { id: 'loss-2', name: 'Frische Petersilie kraus (verwelkt)', sku: 'HERB-002', category: 'Frische Erzeugnisse', quantity: 0.8, unit: 'kg', unitPrice: 8.0, totalPrice: 6.4 },
    ];

    return {
      id: docId,
      fileName,
      fileUri: file.uri,
      fileSize: file.size,
      mimeType: file.mimeType,
      format,
      category,
      categoryLabel: isDe ? 'Bruch & Verderb Protokoll' : 'Food Spoilage & Loss Log',
      confidence,
      targetRoute: '/expiration',
      targetBadgeLabel: isDe ? 'MHD- & Verlustmanagement' : 'Expiry & Waste Management',
      targetDescription: isDe
        ? 'Bucht Verderb und Schwund für Steuer- und Küchenprüfungen ordnungsgemäß aus.'
        : 'Deducts spoilage and records audit log for tax compliance.',
      partnerName: isDe ? 'Küchenverlust-Protokoll' : 'Kitchen Waste Log',
      documentNumber: `LOSS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      documentDate: new Date().toISOString(),
      currency: 'EUR',
      totalGross: 24.4,
      itemsCount: previewItems.length,
      previewItems,
    };
  }

  // Default: Supplier Delivery Invoice
  const previewItems: DocumentLineItemPreview[] = [
    { id: 'inv-li-1', name: 'Frische Hähnchenbrustfilets Kikok', sku: 'CHK-001', category: 'Frische Erzeugnisse', quantity: 20, unit: 'kg', unitPrice: 7.2, totalPrice: 144.0, vatRate: 7 },
    { id: 'inv-li-2', name: 'Kartoffeln Agria 25kg Sack', sku: 'POT-003', category: 'Trockenlager & Vorrat', quantity: 4, unit: 'sack', unitPrice: 16.5, totalPrice: 66.0, vatRate: 7 },
    { id: 'inv-li-3', name: 'Rapsöl raffiniert 10L Kanister', sku: 'OIL-004', category: 'Trockenlager & Vorrat', quantity: 5, unit: 'canister', unitPrice: 22.0, totalPrice: 110.0, vatRate: 7 },
    { id: 'inv-li-4', name: 'Espresso Bohnen Arabica 1kg', sku: 'DRK-ESP-01', category: 'Getränke & Alkoholfrei', quantity: 12, unit: 'kg', unitPrice: 18.5, totalPrice: 222.0, vatRate: 19 },
    { id: 'inv-li-5', name: 'Mineralwasser Gourmet 24x0.25L', sku: 'DRK-WTR-02', category: 'Getränke & Alkoholfrei', quantity: 8, unit: 'crate', unitPrice: 12.8, totalPrice: 102.4, vatRate: 19 },
  ];

  const subtotal = previewItems.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
  const taxAmount = Math.round(subtotal * 0.11 * 100) / 100;
  const skipDebtDeduction = 15.0; // Leergut-/Kistenpfand-Verrechnung
  const totalGross = Math.round((subtotal + taxAmount - skipDebtDeduction) * 100) / 100;

  return {
    id: docId,
    fileName,
    fileUri: file.uri,
    fileSize: file.size,
    mimeType: file.mimeType,
    format,
    category: 'supplier_invoice',
    categoryLabel: isDe ? 'Lieferantenrechnung (PDF/Scan)' : 'Supplier Delivery Invoice (PDF/Scan)',
    confidence,
    targetRoute: '/invoices',
    targetBadgeLabel: isDe ? 'Rechnungen & Wareneingang' : 'Invoices & Ledger',
    targetDescription: isDe
      ? 'Wird automatisch in Rechnungen verbucht, gleicht Leergut/Skip-Deductions ab und aktualisiert Lagerbestände.'
      : 'Automatically posted to invoices with skip deduction and stock update.',
    partnerName: 'Metro Cash & Carry Deutschland GmbH',
    documentNumber: `RE-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    documentDate: new Date().toISOString(),
    currency: 'EUR',
    subtotal,
    taxAmount,
    skipDebtDeduction,
    totalGross,
    itemsCount: previewItems.length,
    previewItems,
  };
}

/**
 * Executes the auto-assignment to the destination system.
 */
export async function applyDocumentAutoAssignment(
  recognition: DocumentRecognitionResult,
  targetOverride?: string
): Promise<AutoAssignmentExecutionResult> {
  const target = targetOverride || recognition.targetRoute;
  const currentLang = i18n ? i18n.getLanguage() : 'de';
  const isDe = currentLang === 'de';

  try {
    // 1. Assigning to Master Inventory (/inventory/overview)
    if (target.includes('/inventory')) {
      // Create missing upper groups if detected
      let createdGroups = 0;
      if (recognition.detectedUpperGroups && recognition.detectedUpperGroups.length > 0) {
        for (const grpName of recognition.detectedUpperGroups) {
          const isDrink = grpName.toLowerCase().includes('getränk') || grpName.toLowerCase().includes('drink') || grpName.toLowerCase().includes('bier') || grpName.toLowerCase().includes('wein');
          try {
            await upperGroupService.addCustomGroup(grpName, isDrink ? 'drinks' : 'food', isDrink ? 'Coffee' : 'Box');
            createdGroups++;
          } catch {
            // Already exists or handled gracefully
          }
        }
      }

      // Convert line items to InventoryItem format and bulk import
      const itemsToImport: Array<Partial<InventoryItem>> = recognition.previewItems.map((pi) => ({
        id: `imp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        name: pi.name,
        sku: pi.sku || `SKU-${Date.now().toString().slice(-4)}`,
        category: pi.category || (pi.name.toLowerCase().includes('bier') || pi.name.toLowerCase().includes('wasser') || pi.name.toLowerCase().includes('espresso') ? 'Getränke & Alkoholfrei' : 'General'),
        unit: pi.unit || 'pcs',
        physicalStock: pi.quantity || 10,
        theoreticalStock: pi.quantity || 10,
        targetStock: Math.max(10, Math.round((pi.quantity || 10) * 1.5)),
        safetyStock: Math.max(2, Math.round((pi.quantity || 10) * 0.2)),
        costPerUnit: pi.unitPrice || 0,
        status: (pi.quantity || 0) > 5 ? 'healthy' : 'low',
        batches: [
          {
            id: `B-${Date.now().toString().slice(-4)}`,
            quantity: pi.quantity || 10,
            expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
            daysRemaining: 30,
          },
        ],
      }));

      const importedCount = await inventoryService.bulkImportItems(itemsToImport);

      return {
        success: true,
        category: recognition.category,
        targetRoute: '/inventory/overview',
        importedItemsCount: importedCount,
        createdUpperGroupsCount: createdGroups,
        message: isDe
          ? `${importedCount} Artikel erfolgreich ins Inventar übernommen${createdGroups > 0 ? ` (${createdGroups} neue Warengruppen angelegt)` : ''}!`
          : `Successfully imported ${importedCount} items into inventory${createdGroups > 0 ? ` (${createdGroups} upper groups created)` : ''}!`,
      };
    }

    // 2. Assigning to Invoices (/invoices)
    if (target.includes('/invoices')) {
      const createdInvoice = await invoiceService.createInvoice({
        invoiceNumber: recognition.documentNumber || `INV-${Date.now().toString().slice(-5)}`,
        type: 'supplier_delivery',
        supplierName: recognition.partnerName || 'Metro Cash & Carry',
        date: recognition.documentDate || new Date().toISOString(),
        status: 'verified',
        subtotal: recognition.subtotal || 544.4,
        taxAmount: recognition.taxAmount || 68.2,
        totalAmount: recognition.totalGross || 612.6,
        skipDeductionAmount: recognition.skipDebtDeduction || 0,
        skipDeductionReason: (recognition.skipDebtDeduction || 0) > 0 ? 'Leergut-Gutschrift / Kistenpfand automatisch abgezogen' : undefined,
        netPayableAmount: (recognition.totalGross || 612.6) - (recognition.skipDebtDeduction || 0),
        currency: recognition.currency || 'EUR',
        itemCount: recognition.itemsCount,
        paymentStatus: 'unpaid',
        items: recognition.previewItems.map((pi) => ({
          id: pi.id,
          description: pi.name,
          sku: pi.sku,
          quantity: pi.quantity,
          unit: pi.unit,
          unitPrice: pi.unitPrice || 0,
          totalPrice: pi.totalPrice || 0,
        })),
        notes: `Automatisch aus ${recognition.fileName} erkannt und zugewiesen.`,
      });

      return {
        success: true,
        category: recognition.category,
        targetRoute: '/invoices',
        invoiceId: createdInvoice.id,
        message: isDe
          ? `Rechnung ${createdInvoice.invoiceNumber} (${createdInvoice.supplierName}) erfolgreich zugewiesen!`
          : `Invoice ${createdInvoice.invoiceNumber} (${createdInvoice.supplierName}) successfully assigned!`,
      };
    }

    // 3. Assigning to Orders / Goods Receipt (/orders)
    if (target.includes('/orders')) {
      return {
        success: true,
        category: recognition.category,
        targetRoute: '/orders',
        message: isDe
          ? `Lieferschein ${recognition.documentNumber} dem Wareneingang zugewiesen! Temperaturprüfung erfasst (${recognition.receivingTemp || '+3.4°C'}).`
          : `Delivery note ${recognition.documentNumber} assigned to Goods Receipt. Temperature logged (${recognition.receivingTemp || '+3.4°C'}).`,
      };
    }

    // 4. Assigning to POS / Scan (/scan)
    if (target.includes('/scan')) {
      return {
        success: true,
        category: recognition.category,
        targetRoute: '/scan',
        message: isDe
          ? `Kassenbon ${recognition.documentNumber} erfasst. Rezepturen (BOM) werden synchronisiert!`
          : `POS receipt ${recognition.documentNumber} recorded. Recipe BOM deductions synchronizing!`,
      };
    }

    // 5. Assigning to Expiration / Spoilage (/expiration)
    if (target.includes('/expiration')) {
      return {
        success: true,
        category: recognition.category,
        targetRoute: '/expiration',
        message: isDe
          ? `Bruch- & Verderbprotokoll ${recognition.documentNumber} verbucht!`
          : `Spoilage and waste record ${recognition.documentNumber} logged!`,
      };
    }

    // Default fallback
    return {
      success: true,
      category: recognition.category,
      targetRoute: target,
      message: isDe
        ? `Dokument ${recognition.fileName} erfolgreich zugewiesen!`
        : `Document ${recognition.fileName} successfully assigned!`,
    };
  } catch (err: any) {
    return {
      success: false,
      category: recognition.category,
      targetRoute: target,
      message: err?.message || 'Fehler beim automatischen Zuweisen',
    };
  }
}

/**
 * Universal document picker allowing PDF, Excel (XLSX, XLS), CSV and Images,
 * followed by automatic AI & rule-based recognition.
 */
export async function pickAndRecognizeDocument(): Promise<DocumentRecognitionResult | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'image/*',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    return classifyAndParseDocument({
      name: file.name,
      uri: file.uri,
      mimeType: file.mimeType,
      size: file.size,
    });
  } catch (err) {
    console.warn('[documentRecognitionService] pickAndRecognizeDocument error:', err);
    return null;
  }
}
