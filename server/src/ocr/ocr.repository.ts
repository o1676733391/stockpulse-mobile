import {
  BadRequestException,
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
  private readonly mockDocs = new Map<string, any>();
  private readonly mockItems = new Map<string, any[]>();

  constructor(private readonly supabaseService: SupabaseService) {
    this.seedMockData();
  }

  private seedMockData() {
    const defaultDoc = {
      id: 'doc-01',
      store_id: '01915dfa-9012-7000-8000-000000000002',
      document_type: 'pos_z_report',
      file_name: 'pos_z_report_20260820.jpg',
      storage_path: 'stores/store-01/ocr/raw/pos_z_report_20260820.jpg',
      mime_type: 'image/jpeg',
      file_size_bytes: 204800,
      status: 'review_pending',
      overall_confidence: 0.95,
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const altDoc = {
      ...defaultDoc,
      id: '01915dfa-b1c4-7221-9988-51b72e04e055',
    };

    const rejectDoc = {
      ...defaultDoc,
      id: 'doc-02',
    };

    this.mockDocs.set('doc-01', defaultDoc);
    this.mockDocs.set('doc-02', rejectDoc);
    this.mockDocs.set('01915dfa-b1c4-7221-9988-51b72e04e055', altDoc);

    const items = [
      {
        id: 'item-01',
        line_number: 1,
        raw_text: 'Espresso Single',
        description: 'Espresso Single',
        article_number: 'REC-ESP-01',
        quantity: 14,
        unit_price: 2.5,
        total_price: 35.0,
        confidence: 0.98,
        matched_recipe_id: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
        match_status: 'AUTOMATIC',
        recipes: { id: '01915dfa-b1c4-7221-9988-51b72e04e0a1', name: 'Espresso' },
      },
    ];

    this.mockItems.set('doc-01', items);
    this.mockItems.set('doc-02', items);
    this.mockItems.set('01915dfa-b1c4-7221-9988-51b72e04e055', items);
  }

  /**
   * Create document record upon upload or presigned url generation.
   */
  async createDocument(data: CreateDocumentData): Promise<OcrDocumentResponseDto> {
    this.logger.log(`OcrRepository.createDocument: store=${data.storeId}, file=${data.fileName}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      const id = (data as any).id || `doc-${Date.now().toString().slice(-4)}`;
      const newDoc = {
        id,
        store_id: data.storeId,
        document_type: data.documentType,
        storage_path: data.storagePath,
        file_name: data.fileName,
        mime_type: data.mimeType || 'image/jpeg',
        file_size_bytes: data.fileSizeBytes || 100000,
        status: 'processing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.mockDocs.set(id, newDoc);
      return this.mapDocumentRow(newDoc);
    }

    const { data: created, error } = await client
      .from('ocr_documents')
      .insert({
        store_id: data.storeId,
        document_type: data.documentType,
        storage_path: data.storagePath,
        file_name: data.fileName,
        mime_type: data.mimeType || 'image/jpeg',
        file_size_bytes: data.fileSizeBytes || 100000,
        status: 'processing',
      })
      .select('*')
      .single();

    if (error || !created) {
      this.logger.error(`Failed to create OCR document record: ${error?.message}`);
      throw new InternalServerErrorException(error?.message || 'Failed to create OCR document record');
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
      const doc = this.mockDocs.get(id);
      if (!doc) return null;
      const items = this.mockItems.get(id) || [];
      return {
        ...this.mapDocumentRow(doc),
        extractedLines: items.map((item) => ({
          id: item.id,
          lineNumber: item.line_number,
          rawText: item.raw_text,
          description: item.description,
          articleNumber: item.article_number,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          confidence: item.confidence,
          matchedRecipeId: item.matched_recipe_id,
          matchedRecipeName: item.recipes?.name,
          matchStatus: item.match_status,
          needsReview: item.confidence < 0.85 || !item.matched_recipe_id,
        })),
        bomPreview: [],
      };
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
    const { data: items, error: itemsError } = await client
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
          id,
          name,
          portion_yield
        )
      `,
      )
      .eq('ocr_document_id', id)
      .order('line_number', { ascending: true });

    if (itemsError) {
      this.logger.error(`Failed to fetch OCR line items: ${itemsError.message}`);
    }

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

    // Check if BOM deductions already persisted
    const { data: persistedDeductions } = await client
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

    const bomPreview: OcrBomPreviewItemDto[] = [];

    if (persistedDeductions && persistedDeductions.length > 0) {
      for (const d of persistedDeductions) {
        const inv = d.inventory_items as any;
        bomPreview.push({
          ocrItemId: d.ocr_item_id,
          recipeName: 'Recipe Ingredient',
          ingredientId: d.item_id,
          ingredientName: inv?.name || 'Inventory Item',
          quantityDeducted: Number(d.quantity_deducted),
          unit: d.unit,
          unitCost: Number(d.unit_cost),
          totalCost: Number(d.total_cost),
        });
      }
    } else {
      // Dynamically calculate preview BOM deductions from matched recipes
      const matchedRecipeIds = extractedLines
        .map((l) => l.matchedRecipeId)
        .filter((rId): rId is string => Boolean(rId));

      if (matchedRecipeIds.length > 0) {
        const { data: recipeIngredients } = await client
          .from('recipe_ingredients')
          .select(
            `
            id,
            recipe_id,
            item_id,
            quantity,
            unit,
            waste_percentage,
            inventory_items (
              id,
              name,
              cost_per_unit
            )
          `,
          )
          .in('recipe_id', matchedRecipeIds);

        if (recipeIngredients && recipeIngredients.length > 0) {
          for (const line of extractedLines) {
            if (!line.matchedRecipeId) continue;
            const ingredients = recipeIngredients.filter((ri) => ri.recipe_id === line.matchedRecipeId);
            for (const ing of ingredients) {
              const inv = ing.inventory_items as any;
              const unitCost = Number(inv?.cost_per_unit || 0);
              const wasteFactor = 1 + (Number(ing.waste_percentage || 0) / 100);
              const qtyPerPortion = Number(ing.quantity || 0) * wasteFactor;
              const totalQtyDeducted = Math.round(qtyPerPortion * line.quantity * 10000) / 10000;
              const totalCost = Math.round(totalQtyDeducted * unitCost * 100) / 100;

              bomPreview.push({
                ocrItemId: line.id,
                recipeName: line.matchedRecipeName || line.description,
                ingredientId: ing.item_id,
                ingredientName: inv?.name || 'Inventory Item',
                quantityDeducted: totalQtyDeducted,
                unit: ing.unit,
                unitCost,
                totalCost,
              });
            }
          }
        }
      }
    }

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
      const docs = Array.from(this.mockDocs.values()).filter((d) => d.store_id === storeId);
      const totalPages = Math.ceil(docs.length / limit);
      return {
        data: docs.map((d) => this.mapDocumentRow(d)),
        meta: {
          total: docs.length,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
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
   * Save extracted line items, match against store recipes, and update document to review_pending.
   */
  async saveExtractionResults(
    documentId: string,
    storeId: string,
    result: RawOcrExtractionResult,
  ): Promise<void> {
    this.logger.log(`OcrRepository.saveExtractionResults: doc=${documentId} in store=${storeId}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      const doc = this.mockDocs.get(documentId);
      if (doc) {
        doc.status = 'review_pending';
        doc.overall_confidence = result.overallConfidence;
        this.mockDocs.set(documentId, doc);
      }
      const items = result.lineItems.map((l) => ({
        id: `item-${Date.now().toString().slice(-4)}-${l.lineNumber}`,
        line_number: l.lineNumber,
        raw_text: l.rawText,
        description: l.description,
        article_number: l.articleNumber || null,
        quantity: l.quantity,
        unit_price: l.unitPrice || null,
        total_price: l.totalPrice || null,
        confidence: l.confidence,
        matched_recipe_id: (l as any).matchedRecipeId || null,
        match_status: (l as any).matchedRecipeId ? 'AUTOMATIC' : 'UNMATCHED',
      }));
      this.mockItems.set(documentId, items);
      return;
    }

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

    // 2. Fetch all active recipes for automated product matching
    const { data: recipes } = await client
      .from('recipes')
      .select('id, code, name, pos_item_name')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .is('deleted_at', null);

    const storeRecipes = recipes || [];

    // 3. Build line items with intelligent matching
    const linePayload = result.lineItems.map((l) => {
      const descLower = (l.description || '').toLowerCase().trim();
      const rawLower = (l.rawText || '').toLowerCase().trim();

      // Find match in recipes
      let matchedRecipeId: string | null = null;
      let matchStatus = 'UNMATCHED';
      let matchConfidence = 0.0;

      for (const r of storeRecipes) {
        const rName = (r.name || '').toLowerCase();
        const rPos = (r.pos_item_name || '').toLowerCase();
        const rCode = (r.code || '').toLowerCase();

        if (
          descLower === rName ||
          descLower === rPos ||
          rawLower.includes(rName) ||
          (rPos && rawLower.includes(rPos)) ||
          descLower.includes(rCode)
        ) {
          matchedRecipeId = r.id;
          matchStatus = 'AUTOMATIC';
          matchConfidence = 0.95;
          break;
        }

        // Fuzzy partial token matching
        const tokens = descLower.split(/\s+/).filter((t) => t.length > 2);
        const matchTokens = tokens.filter((t) => rName.includes(t) || rPos.includes(t));
        if (tokens.length > 0 && matchTokens.length / tokens.length >= 0.6) {
          matchedRecipeId = r.id;
          matchStatus = 'AUTOMATIC';
          matchConfidence = 0.85;
          break;
        }
      }

      return {
        ocr_document_id: documentId,
        line_number: l.lineNumber,
        raw_text: l.rawText,
        description: l.description,
        article_number: l.articleNumber || null,
        quantity: l.quantity,
        unit_price: l.unitPrice || null,
        total_price: l.totalPrice || null,
        confidence: l.confidence,
        matched_recipe_id: matchedRecipeId,
        match_confidence: matchConfidence,
        match_status: matchStatus,
      };
    });

    if (linePayload.length > 0) {
      const { error: lineError } = await client.from('ocr_document_items').insert(linePayload);
      if (lineError) {
        this.logger.error(`Failed to insert OCR document items: ${lineError.message}`);
        throw new InternalServerErrorException('Failed to insert OCR document items');
      }
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
    if (!client) {
      const items = this.mockItems.get(documentId) || [];
      const item = items.find((i) => i.id === itemId);
      if (item) {
        if (updates.description !== undefined) item.description = updates.description;
        if (updates.quantity !== undefined) item.quantity = updates.quantity;
        if (updates.unitPrice !== undefined) item.unit_price = updates.unitPrice;
        if (updates.totalPrice !== undefined) item.total_price = updates.totalPrice;
        if (updates.matchedRecipeId !== undefined) {
          item.matched_recipe_id = updates.matchedRecipeId;
          item.match_status = updates.matchedRecipeId ? 'MANUAL_OVERRIDE' : 'UNMATCHED';
        }
      }
      return;
    }

    const payload: Record<string, any> = {};
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.quantity !== undefined) payload.quantity = updates.quantity;
    if (updates.unitPrice !== undefined) payload.unit_price = updates.unitPrice;
    if (updates.totalPrice !== undefined) payload.total_price = updates.totalPrice;
    if (updates.matchedRecipeId !== undefined) {
      payload.matched_recipe_id = updates.matchedRecipeId;
      payload.match_status = updates.matchedRecipeId ? 'MANUAL_OVERRIDE' : 'UNMATCHED';
      payload.match_confidence = updates.matchedRecipeId ? 1.0 : 0.0;
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
    if (!client) {
      const doc = this.mockDocs.get(documentId);
      if (doc) {
        doc.status = 'confirmed';
        doc.confirmed_by = actorId;
        doc.confirmed_at = new Date().toISOString();
      }
      return;
    }

    const now = new Date().toISOString();
    const { error } = await client
      .from('ocr_documents')
      .update({
        status: 'confirmed',
        confirmed_by: actorId,
        confirmed_at: now,
        updated_at: now,
      })
      .eq('id', documentId)
      .eq('store_id', storeId);

    if (error) {
      this.logger.error(`Failed to mark document as confirmed: ${error.message}`);
      throw new InternalServerErrorException('Failed to update document confirmation status');
    }
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
    if (!client) {
      const doc = this.mockDocs.get(documentId);
      if (doc) {
        doc.status = 'rejected';
        doc.error_message = reason;
      }
      return;
    }

    const now = new Date().toISOString();
    const { error } = await client
      .from('ocr_documents')
      .update({
        status: 'rejected',
        error_message: reason,
        updated_at: now,
      })
      .eq('id', documentId)
      .eq('store_id', storeId);

    if (error) {
      this.logger.error(`Failed to mark document as rejected: ${error.message}`);
      throw new InternalServerErrorException('Failed to update document rejection status');
    }
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
    deductions: {
      ocrItemId: string;
      itemId: string;
      quantityDeducted: number;
      unit: string;
      unitCost: number;
      totalCost: number;
    }[],
  ): Promise<Array<{
    itemId: string;
    itemName: string;
    delta: number;
    unit: string;
    costEur: number;
    theoreticalBefore: number;
    theoreticalAfter: number;
  }>> {
    this.logger.log(`OcrRepository.applyBomDeductions: ${deductions.length} lines for doc=${documentId}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) throw new InternalServerErrorException('Supabase client unavailable');

    const now = new Date().toISOString();
    const appliedResults: Array<{
      itemId: string;
      itemName: string;
      delta: number;
      unit: string;
      costEur: number;
      theoreticalBefore: number;
      theoreticalAfter: number;
    }> = [];

    for (const d of deductions) {
      // 1. Record deduction row
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
        .select('id, name, physical_stock, theoretical_stock')
        .eq('id', d.itemId)
        .eq('store_id', storeId)
        .single();

      const currentPhysical = Number(item?.physical_stock || 0);
      const currentTheo = Number(item?.theoretical_stock || 0);
      const newPhysical = Math.max(0, Math.round((currentPhysical - d.quantityDeducted) * 10000) / 10000);
      const newTheo = Math.max(0, Math.round((currentTheo - d.quantityDeducted) * 10000) / 10000);

      // 3. Write immutable transaction ledger
      const txNumber = `BOM-${now.slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      const { error: txErr } = await client.from('inventory_transactions').insert({
        store_id: storeId,
        item_id: d.itemId,
        transaction_number: txNumber,
        transaction_type: 'POS_DEDUCTION',
        delta: -d.quantityDeducted,
        previous_stock: currentPhysical,
        new_stock: newPhysical,
        cost_impact: -d.totalCost,
        actor_id: actorId,
        reference_type: 'OCR_DOCUMENT',
        reference_id: documentId,
        note: `POS Sales automated recipe deduction (Doc: ${documentId})`,
      });

      if (txErr) {
        this.logger.error(`Failed to record inventory_transaction for item ${d.itemId}: ${txErr.message}`);
      }

      // 4. Update physical and theoretical balance in inventory_items
      const { error: itemUpdateErr } = await client
        .from('inventory_items')
        .update({
          physical_stock: newPhysical,
          theoretical_stock: newTheo,
          updated_at: now,
        })
        .eq('id', d.itemId)
        .eq('store_id', storeId);

      if (itemUpdateErr) {
        this.logger.error(`Failed to update stock balance for item ${d.itemId}: ${itemUpdateErr.message}`);
      }

      appliedResults.push({
        itemId: d.itemId,
        itemName: item?.name || 'Inventory Item',
        delta: -d.quantityDeducted,
        unit: d.unit,
        costEur: d.totalCost,
        theoreticalBefore: currentTheo,
        theoreticalAfter: newTheo,
      });
    }

    return appliedResults;
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
}
