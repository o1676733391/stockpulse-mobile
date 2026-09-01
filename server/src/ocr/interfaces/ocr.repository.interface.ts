import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import {
  OcrDocumentDetailResponseDto,
  OcrDocumentResponseDto,
  QueryOcrDocumentsDto,
  UpdateOcrItemDto,
} from '../dto/ocr.dto';
import { OcrDocumentEntity, OcrStatus } from '../entities/ocr-document.entity';
import { RawOcrExtractionResult, RawOcrLineItem } from './ocr-provider.interface';

export interface CreateDocumentData {
  storeId: string;
  documentType: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  actorId?: string;
}

export interface IOcrRepository {
  createDocument(data: CreateDocumentData): Promise<OcrDocumentResponseDto>;

  findDocumentById(
    id: string,
    storeId: string,
  ): Promise<OcrDocumentDetailResponseDto | null>;

  findDocuments(
    query: QueryOcrDocumentsDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<OcrDocumentResponseDto>>;

  saveExtractionResults(
    documentId: string,
    storeId: string,
    result: RawOcrExtractionResult,
  ): Promise<void>;

  updateDocumentItem(
    documentId: string,
    itemId: string,
    updates: UpdateOcrItemDto,
    storeId: string,
  ): Promise<void>;

  markDocumentConfirmed(
    documentId: string,
    storeId: string,
    actorId: string,
    notes?: string,
  ): Promise<void>;

  markDocumentRejected(
    documentId: string,
    storeId: string,
    actorId: string,
    reason: string,
  ): Promise<void>;

  markDocumentFailed(
    documentId: string,
    storeId: string,
    errorMessage: string,
  ): Promise<void>;

  applyBomDeductions(
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
  ): Promise<
    Array<{
      itemId: string;
      itemName: string;
      delta: number;
      unit: string;
      costEur: number;
      theoreticalBefore: number;
      theoreticalAfter: number;
    }>
  >;
}
