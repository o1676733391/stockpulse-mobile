import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import {
  AuditChainVerificationResponseDto,
  AuditLogResponseDto,
  AuditQueryDto,
  CreateAuditLogDto,
} from './dto/audit.dto';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  /**
   * Search immutable audit records with pagination and filters.
   */
  async searchAuditLogs(
    storeId: string,
    query: AuditQueryDto,
  ): Promise<PaginatedResponseDto<AuditLogResponseDto>> {
    return this.auditRepository.searchAuditLogs(storeId, query);
  }

  /**
   * Get single audit record by ID.
   */
  async findById(id: string, storeId?: string): Promise<AuditLogResponseDto> {
    const log = await this.auditRepository.findById(id, storeId);
    if (!log) {
      throw new NotFoundException(`Audit record '${id}' not found`);
    }
    return log;
  }

  /**
   * Generic append-only write of an audit event.
   */
  async logEvent(data: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    return this.auditRepository.create(data);
  }

  /**
   * Verify cryptographic ledger chain integrity.
   */
  async verifyChainIntegrity(storeId: string): Promise<AuditChainVerificationResponseDto> {
    return this.auditRepository.verifyChainIntegrity(storeId);
  }

  // --------------------------------------------------------------------------
  // Domain Event Tracking Helpers
  // --------------------------------------------------------------------------

  /**
   * Track User Login Event.
   */
  async trackLogin(params: {
    actorId: string;
    actorName: string;
    actorRole: string;
    storeId: string;
    organizationId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLogResponseDto> {
    return this.logEvent({
      organizationId: params.organizationId,
      storeId: params.storeId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      eventAction: 'USER_LOGIN',
      entityType: 'auth',
      entityId: params.actorId,
      entityIdentifier: params.actorName,
      stateAfter: { loginTime: new Date().toISOString() },
    });
  }

  /**
   * Track Inventory Item Updates, Creations, Adjustments, and Archiving.
   */
  async trackInventoryUpdate(params: {
    actorId: string;
    actorName?: string;
    actorRole?: string;
    storeId: string;
    organizationId: string;
    action: 'INVENTORY_CREATE' | 'INVENTORY_UPDATE' | 'INVENTORY_ADJUST' | 'INVENTORY_ARCHIVE';
    itemId: string;
    sku: string;
    stateBefore?: Record<string, unknown>;
    stateAfter?: Record<string, unknown>;
    stateDiff?: Record<string, unknown>;
    reasonCode?: string;
  }): Promise<AuditLogResponseDto> {
    return this.logEvent({
      organizationId: params.organizationId,
      storeId: params.storeId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      eventAction: params.action,
      entityType: 'inventory_item',
      entityId: params.itemId,
      entityIdentifier: params.sku,
      stateBefore: params.stateBefore,
      stateAfter: params.stateAfter,
      stateDiff: params.stateDiff,
      reasonCode: params.reasonCode,
    });
  }

  /**
   * Track Stock Count Sessions and Variance Approvals.
   */
  async trackStockCount(params: {
    actorId: string;
    actorName?: string;
    actorRole?: string;
    storeId: string;
    organizationId: string;
    action: 'STOCK_COUNT_START' | 'STOCK_COUNT_SUBMIT' | 'STOCK_COUNT_APPROVE';
    sessionId: string;
    sessionNumber: string;
    details?: Record<string, unknown>;
  }): Promise<AuditLogResponseDto> {
    return this.logEvent({
      organizationId: params.organizationId,
      storeId: params.storeId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      eventAction: params.action,
      entityType: 'stock_count',
      entityId: params.sessionId,
      entityIdentifier: params.sessionNumber,
      stateAfter: params.details,
      stateDiff: params.details,
    });
  }

  /**
   * Track OCR Document Scans, Review Updates, Approvals, and Deductions.
   */
  async trackOcrApproval(params: {
    actorId: string;
    actorName?: string;
    actorRole?: string;
    storeId: string;
    organizationId: string;
    action: 'OCR_UPLOAD' | 'OCR_ITEM_UPDATE' | 'OCR_CONFIRM' | 'OCR_REJECT';
    documentId: string;
    fileName: string;
    details?: Record<string, unknown>;
  }): Promise<AuditLogResponseDto> {
    return this.logEvent({
      organizationId: params.organizationId,
      storeId: params.storeId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      eventAction: params.action,
      entityType: 'ocr_document',
      entityId: params.documentId,
      entityIdentifier: params.fileName,
      stateAfter: params.details,
      stateDiff: params.details,
    });
  }

  /**
   * Track Purchase Order Drafting, Submissions, Approvals, and Cancellations.
   */
  async trackPurchaseOrder(params: {
    actorId: string;
    actorName?: string;
    actorRole?: string;
    storeId: string;
    organizationId: string;
    action: 'PO_CREATE' | 'PO_SUBMIT' | 'PO_APPROVE' | 'PO_CANCEL';
    poId: string;
    orderNumber: string;
    stateBefore?: Record<string, unknown>;
    stateAfter?: Record<string, unknown>;
    reason?: string;
  }): Promise<AuditLogResponseDto> {
    return this.logEvent({
      organizationId: params.organizationId,
      storeId: params.storeId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      eventAction: params.action,
      entityType: 'purchase_order',
      entityId: params.poId,
      entityIdentifier: params.orderNumber,
      stateBefore: params.stateBefore,
      stateAfter: params.stateAfter,
      reasonCode: params.reason,
    });
  }

  /**
   * Track Goods Receipts and Batch Inventory Deliveries.
   */
  async trackGoodsReceipt(params: {
    actorId: string;
    actorName?: string;
    actorRole?: string;
    storeId: string;
    organizationId: string;
    grId: string;
    receiptNumber: string;
    poId?: string;
    totalAmount?: number;
    details?: Record<string, unknown>;
  }): Promise<AuditLogResponseDto> {
    return this.logEvent({
      organizationId: params.organizationId,
      storeId: params.storeId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      eventAction: 'GOODS_RECEIPT_CREATE',
      entityType: 'goods_receipt',
      entityId: params.grId,
      entityIdentifier: params.receiptNumber,
      stateAfter: {
        poId: params.poId,
        totalAmount: params.totalAmount,
        ...params.details,
      },
    });
  }
}
