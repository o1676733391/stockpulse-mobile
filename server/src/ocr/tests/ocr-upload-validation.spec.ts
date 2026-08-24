import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PresignedUploadRequestDto } from '../dto/ocr.dto';

describe('OCR - Upload & File Validation Tests', () => {
  it('1. Valid upload: Should accept valid JPEG image within size limits', async () => {
    const dto = plainToInstance(PresignedUploadRequestDto, {
      mimeType: 'image/jpeg',
      fileSizeBytes: 204800, // 200 KB
      documentType: 'pos_z_report',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('2. Valid upload: Should accept valid PNG image and PDF files', async () => {
    const pngDto = plainToInstance(PresignedUploadRequestDto, {
      mimeType: 'image/png',
      fileSizeBytes: 1048576, // 1 MB
      documentType: 'supplier_invoice',
    });
    const pdfDto = plainToInstance(PresignedUploadRequestDto, {
      mimeType: 'application/pdf',
      fileSizeBytes: 5242880, // 5 MB
      documentType: 'generic_receipt',
    });

    const pngErrors = await validate(pngDto);
    const pdfErrors = await validate(pdfDto);

    expect(pngErrors).toHaveLength(0);
    expect(pdfErrors).toHaveLength(0);
  });

  it('3. Oversized file: Should reject files exceeding 10MB limit', async () => {
    const oversizedDto = plainToInstance(PresignedUploadRequestDto, {
      mimeType: 'image/jpeg',
      fileSizeBytes: 15728640, // 15 MB (> 10MB limit)
      documentType: 'pos_z_report',
    });

    const errors = await validate(oversizedDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fileSizeBytes');
  });

  it('4. Zero/Negative size: Should reject file size <= 0 bytes', async () => {
    const zeroDto = plainToInstance(PresignedUploadRequestDto, {
      mimeType: 'image/jpeg',
      fileSizeBytes: 0,
      documentType: 'pos_z_report',
    });

    const errors = await validate(zeroDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fileSizeBytes');
  });

  it('5. Unsupported format: Should reject unapproved MIME types (e.g. image/gif, text/plain)', async () => {
    const gifDto = plainToInstance(PresignedUploadRequestDto, {
      mimeType: 'image/gif', // Not in allowed list
      fileSizeBytes: 100000,
      documentType: 'pos_z_report',
    });
    const txtDto = plainToInstance(PresignedUploadRequestDto, {
      mimeType: 'text/plain',
      fileSizeBytes: 5000,
      documentType: 'pos_z_report',
    });

    const gifErrors = await validate(gifDto);
    const txtErrors = await validate(txtDto);

    expect(gifErrors.length).toBeGreaterThan(0);
    expect(txtErrors.length).toBeGreaterThan(0);
  });

  it('6. Invalid document classification: Should reject unknown document types', async () => {
    const invalidTypeDto = plainToInstance(PresignedUploadRequestDto, {
      mimeType: 'image/jpeg',
      fileSizeBytes: 100000,
      documentType: 'unknown_unsupported_type',
    });

    const errors = await validate(invalidTypeDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('documentType');
  });
});
