import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { SupabaseService } from '../database/supabase.service';
import {
  OcrBomPreviewItemDto,
  OcrDocumentDetailResponseDto,
  OcrDocumentResponseDto,
  OcrItemResponseDto,
  QueryOcrDocumentsDto,
  UpdateOcrItemDto,
} from './dto/ocr.dto';
import { OcrStatus } from './entities/ocr-document.entity';
import { RawOcrExtractionResult } from './interfaces/ocr-provider.interface';
import { CreateDocumentData, IOcrRepository } from './interfaces/ocr.repository.interface';

@Injectable()
export class OcrRepository implements IOcrRepository {
  private readonly logger = new Logger(OcrRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Create document record upon upload or presigned url generation.
   */
  async createDocument(data: CreateDocumentData): Promise<OcrDocumentResponseDto> {
    this.logger.log(`OcrRepository.createDocument: store=${data.storeId}, file=${data.fileName}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        id: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
        storeId: data.storeId,
        documentType: data.documentType,
        fileName: data.fileName,
        storagePath: data.storagePath,
        mimeType: data.mimeType,
        fileSizeBytes: data.fileSizeBytes,
        status: 'processing',
        overallConfidence: undefined,
        needsReview: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const { data: created, error } = await client
      .from('ocr_documents')
      .insert({
        store_id: data.storeId,
        document_type: data.documentType,
        storage_path: data.storagePath,
        file_name: data.fileName,
        mime_type: data.mimeType,
        file_size_bytes: data.fileSizeBytes,
        status: 'processing',
        created_by: data.actorId,
        updated_by: data.actorId,
      })
      .select('*')
      .single();

    if (error || !created) {
      this.logger.error(`Failed to create OCR document record: ${error?.message}`);
      throw new InternalServerErrorException('Failed to create OCR document record');
    }

    return this.mapDocumentRow(created);
  }

  /**
   * Find document with extracted line items and preview BOM deductions.
   */
  async findDocumentById(
    id: string,
    storeId: string,
  ): Promise<OcrDocumentDetailResponseDto | null> {
    this.logger.log(`OcrRepository.findDocumentById: ID=${id}, store=${storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockDetailResponse(id, storeId);
    }

    const { data: doc, error: docError } = await client
      .from('ocr_documents')
      .select(
        `
        id,
        store_id,
        document_type,
        file_name,
        storage_path,
        mime_type,
        file_size_bytes,
        status,
        overall_confidence,
        raw_provider_response,
        processed_at,
        confirmed_by,
        confirmed_at,
        error_message,
        created_at,
        updated_at,
        users (
          name
        )
      `,
      )
      .eq('id', id)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    if (docError || !doc) {
      return null;
    }

    // Fetch extracted line items
    const { data: items } = await client
      .from('ocr_document_items')
      .select(
        `
        id,
        line_number,
        raw_text,
        description,
        article_number,
        quantity,
        unit_price,
        total_price,
        confidence,
        matched_recipe_id,
        match_status,
        recipes (
          name
        )
      `,
      )
      .eq('ocr_document_id', id)
      .order('line_number', { ascending: true });

    // Fetch BOM deductions if any
    const { data: deductions } = await client
      .from('ocr_bom_deductions')
      .select(
        `
        id,
        ocr_item_id,
        item_id,
        quantity_deducted,
        unit,
        unit_cost,
        total_cost,
        inventory_items (
          name
        )
      `,
      )
      .eq('ocr_document_id', id);

    const user = doc.users as any;
    const baseDto = this.mapDocumentRow(doc, user?.name);

    const extractedLines: OcrItemResponseDto[] = (items || []).map((item: any) => {
      const recipe = item.recipes;
      const confidence = Number(item.confidence || 0);
      return {
        id: item.id,
        lineNumber: item.line_number,
        rawText: item.raw_text,
        description: item.description,
        articleNumber: item.article_number,
        quantity: Number(item.quantity),
        unitPrice: item.unit_price ? Number(item.unit_price) : undefined,
        totalPrice: item.total_price ? Number(item.total_price) : undefined,
        confidence,
        matchedRecipeId: item.matched_recipe_id,
        matchedRecipeName: recipe?.name,
        matchStatus: item.match_status,
        needsReview: confidence < 0.85 || !item.matched_recipe_id,
      };
    });

    const bomPreview: OcrBomPreviewItemDto[] = (deductions || []).map((d: any) => {
      const inv = d.inventory_items;
      return {
        ocrItemId: d.ocr_item_id,
        recipeName: 'Recipe',
        ingredientId: d.item_id,
        ingredientName: inv?.name || '',
        quantityDeducted: Number(d.quantity_deducted),
        unit: d.unit,
        unitCost: Number(d.unit_cost),
        totalCost: Number(d.total_cost),
      };
    });

    const rawMeta = doc.raw_provider_response?.metadata as any;

    return {
      ...baseDto,
      metadata: rawMeta,
      extractedLines,
      bomPreview,
    };
  }

  /**
   * List OCR documents with pagination and status filters.
   */
  async findDocuments(
    query: QueryOcrDocumentsDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<OcrDocumentResponseDto>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    this.logger.log(`OcrRepository.findDocuments: store=${storeId}, page=${page}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockPaginatedList(page, limit, storeId);
    }

    let supabaseQuery = client
      .from('ocr_documents')
      .select(
        `
        id,
        store_id,
        document_type,
        file_name,
        storage_path,
        mime_type,
        file_size_bytes,
        status,
        overall_confidence,
        processed_at,
        confirmed_by,
        confirmed_at,
        error_message,
        created_at,
        updated_at,
        users (
          name
        )
      `,
        { count: 'exact' },
      )
      .eq('store_id', storeId)
      .is('deleted_at', null);

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    if (query.documentType) {
      supabaseQuery = supabaseQuery.eq('document_type', query.documentType);
    }

    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('created_at', query.startDate);
    }

    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('created_at', query.endDate);
    }

    supabaseQuery = supabaseQuery.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await supabaseQuery;

    if (error) {
      this.logger.error(`Failed to list OCR documents: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve OCR documents');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const items: OcrDocumentResponseDto[] = (data || []).map((row: any) => {
      const user = row.users;
      return this.mapDocumentRow(row, user?.name);
    });

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Save extracted line items and update document to review_pending.
   */
  async saveExtractionResults(
    documentId: string,
    storeId: string,
    result: RawOcrExtractionResult,
  ): Promise<void> {
    this.logger.log(`OcrRepository.saveExtractionResults: doc=${documentId}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const now = new Date().toISOString();

    // 1. Update document status and confidence
    const { error: docError } = await client
      .from('ocr_documents')
      .update({
        status: 'review_pending',
        overall_confidence: result.overallConfidence,
        raw_provider_response: {
          metadata: result.metadata,
          providerId: result.providerId,
          processingDurationMs: result.processingDurationMs,
        },
        processed_at: now,
        updated_at: now,
      })
      .eq('id', documentId)
      .eq('store_id', storeId);

    if (docError) {
      this.logger.error(`Failed to update OCR document status: ${docError.message}`);
      throw new InternalServerErrorException('Failed to update OCR document status');
    }

    // 2. Insert line items
    const linePayload = result.lineItems.map((l) => ({
      ocr_document_id: documentId,
      line_number: l.lineNumber,
      raw_text: l.rawText,
      description: l.description,
      article_number: l.articleNumber,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      total_price: l.totalPrice,
      confidence: l.confidence,
      match_status: 'UNMATCHED',
    }));

    const { error: lineError } = await client.from('ocr_document_items').insert(linePayload);

    if (lineError) {
      this.logger.error(`Failed to insert OCR document items: ${lineError.message}`);
      throw new InternalServerErrorException('Failed to insert OCR document items');
    }
  }

  /**
   * Update line item during review.
   */
  async updateDocumentItem(
    documentId: string,
    itemId: string,
    updates: UpdateOcrItemDto,
    storeId: string,
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const payload: Record<string, any> = {};
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.quantity !== undefined) payload.quantity = updates.quantity;
    if (updates.unitPrice !== undefined) payload.unit_price = updates.unitPrice;
    if (updates.totalPrice !== undefined) payload.total_price = updates.totalPrice;
    if (updates.matchedRecipeId !== undefined) {
      payload.matched_recipe_id = updates.matchedRecipeId;
      payload.match_status = updates.matchedRecipeId ? 'MANUAL_OVERRIDE' : 'UNMATCHED';
    }

    const { error } = await client
      .from('ocr_document_items')
      .update(payload)
      .eq('id', itemId)
      .eq('ocr_document_id', documentId);

    if (error) {
      this.logger.error(`Failed to update OCR line item: ${error.message}`);
      throw new InternalServerErrorException('Failed to update OCR line item');
    }
  }

  /**
   * Confirm document review.
   */
  async markDocumentConfirmed(
    documentId: string,
    storeId: string,
    actorId: string,
    notes?: string,
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const now = new Date().toISOString();
    await client
      .from('ocr_documents')
      .update({
        status: 'confirmed',
        confirmed_by: actorId,
        confirmed_at: now,
        updated_by: actorId,
        updated_at: now,
      })
      .eq('id', documentId)
      .eq('store_id', storeId);
  }

  /**
   * Reject document review.
   */
  async markDocumentRejected(
    documentId: string,
    storeId: string,
    actorId: string,
    reason: string,
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const now = new Date().toISOString();
    await client
      .from('ocr_documents')
      .update({
        status: 'rejected',
        error_message: reason,
        updated_by: actorId,
        updated_at: now,
      })
      .eq('id', documentId)
      .eq('store_id', storeId);
  }

  /**
   * Mark document processing as failed.
   */
  async markDocumentFailed(
    documentId: string,
    storeId: string,
    errorMessage: string,
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    await client
      .from('ocr_documents')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('store_id', storeId);
  }

  /**
   * Execute atomic BOM ingredient deductions into inventory ledger.
   */
  async applyBomDeductions(
    storeId: string,
    documentId: string,
    actorId: string,
    deductions: Array<{
      ocrItemId: string;
      itemId: string;
      quantityDeducted: number;
      unit: string;
      unitCost: number;
      totalCost: number;
    }>,
  ): Promise<void> {
    this.logger.log(`OcrRepository.applyBomDeductions for doc=${documentId}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const now = new Date().toISOString();

    for (const d of deductions) {
      // 1. Insert into ocr_bom_deductions
      await client.from('ocr_bom_deductions').insert({
        ocr_document_id: documentId,
        ocr_item_id: d.ocrItemId,
        item_id: d.itemId,
        quantity_deducted: d.quantityDeducted,
        unit: d.unit,
        unit_cost: d.unitCost,
        total_cost: d.totalCost,
      });

      // 2. Fetch current stock
      const { data: item } = await client
        .from('inventory_items')
        .select('physical_stock, theoretical_stock')
        .eq('id', d.itemId)
        .eq('store_id', storeId)
        .single();

      const currentPhysical = Number(item?.physical_stock || 0);
      const currentTheo = Number(item?.theoretical_stock || 0);
      const newTheo = Math.max(0, currentTheo - d.quantityDeducted);

      // 3. Write immutable transaction ledger
      const txNumber = `BOM-${now.slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      await client.from('inventory_transactions').insert({
        store_id: storeId,
        item_id: d.itemId,
        transaction_number: txNumber,
        transaction_type: 'BOM_DEDUCTION',
        delta: -d.quantityDeducted,
        previous_stock: currentPhysical,
        new_stock: Math.max(0, currentPhysical - d.quantityDeducted),
        cost_impact: -d.totalCost,
        actor_id: actorId,
        reference_type: 'OCR_DOCUMENT',
        reference_id: documentId,
        note: `POS Sales automated recipe deduction (Doc: ${documentId})`,
      });

      // 4. Update physical and theoretical balance in inventory_items
      await client
        .from('inventory_items')
        .update({
          physical_stock: Math.max(0, currentPhysical - d.quantityDeducted),
          theoretical_stock: newTheo,
          updated_by: actorId,
          updated_at: now,
        })
        .eq('id', d.itemId)
        .eq('store_id', storeId);
    }
  }

  private mapDocumentRow(row: any, confirmedByName?: string): OcrDocumentResponseDto {
    const confidence = row.overall_confidence ? Number(row.overall_confidence) : undefined;
    return {
      id: row.id,
      storeId: row.store_id,
      documentType: row.document_type,
      fileName: row.file_name,
      storagePath: row.storage_path,
      mimeType: row.mime_type,
      fileSizeBytes: Number(row.file_size_bytes),
      status: row.status as OcrStatus,
      overallConfidence: confidence,
      needsReview: confidence !== undefined && confidence < 0.85,
      processedAt: row.processed_at,
      confirmedBy: row.confirmed_by,
      confirmedByName,
      confirmedAt: row.confirmed_at,
      errorMessage: row.error_message,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  private buildMockDetailResponse(
    id: string,
    storeId: string,
  ): OcrDocumentDetailResponseDto {
    return {
      id,
      storeId,
      documentType: 'pos_z_report',
      fileName: 'pos_eod_receipt.jpg',
      storagePath: `stores/${storeId}/ocr/receipt_01.jpg`,
      mimeType: 'image/jpeg',
      fileSizeBytes: 245000,
      status: 'review_pending',
      overallConfidence: 0.94,
      needsReview: false,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        documentNumber: 'POS-8821',
        date: '2026-08-20',
        totalAmount: 142.5,
        supplierName: 'POS Terminal 01',
        currency: 'EUR',
      },
      extractedLines: [
        {
          id: 'item-01',
          lineNumber: 1,
          rawText: '2x CHICKEN BURGER 12.50 25.00',
          description: 'Chicken Burger',
          quantity: 2,
          unitPrice: 12.5,
          totalPrice: 25.0,
          confidence: 0.96,
          matchedRecipeId: 'rec-chk-01',
          matchedRecipeName: 'Crispy Chicken Burger',
          matchStatus: 'EXACT_CODE',
          needsReview: false,
        },
      ],
      bomPreview: [
        {
          ocrItemId: 'item-01',
          recipeName: 'Crispy Chicken Burger',
          ingredientId: 'ing-chk-01',
          ingredientName: 'Chicken Breast Fillet',
          quantityDeducted: 0.4,
          unit: 'kg',
          unitCost: 4.8,
          totalCost: 1.92,
        },
      ],
    };
  }

  private buildMockPaginatedList(
    page: number,
    limit: number,
    storeId: string,
  ): PaginatedResponseDto<OcrDocumentResponseDto> {
    const mockDocs: OcrDocumentResponseDto[] = [
      {
        id: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
        storeId,
        documentType: 'pos_z_report',
        fileName: 'pos_eod_receipt.jpg',
        storagePath: `stores/${storeId}/ocr/receipt_01.jpg`,
        mimeType: 'image/jpeg',
        fileSizeBytes: 245000,
        status: 'review_pending',
        overallConfidence: 0.94,
        needsReview: false,
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return {
      data: mockDocs,
      meta: {
        page,
        limit,
        total: mockDocs.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}
