import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { SupabaseService } from '../database/supabase.service';
import {
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  GoodsReceiptDetailResponseDto,
  GoodsReceiptItemResponseDto,
  GoodsReceiptResponseDto,
  PurchaseOrderDetailResponseDto,
  PurchaseOrderItemResponseDto,
  PurchaseOrderResponseDto,
  QueryGoodsReceiptsDto,
  QueryPurchaseOrdersDto,
  UpdatePurchaseOrderDto,
} from './dto/procurement.dto';
import { PurchaseOrderStatus } from './entities/purchase-order.entity';
import { IProcurementRepository } from './interfaces/procurement.repository.interface';

@Injectable()
export class ProcurementRepository implements IProcurementRepository {
  private readonly logger = new Logger(ProcurementRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Find paginated list of Purchase Orders with filters.
   */
  async findPurchaseOrders(
    query: QueryPurchaseOrdersDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<PurchaseOrderResponseDto>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    this.logger.log(`ProcurementRepository.findPurchaseOrders: store=${storeId}, page=${page}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockPurchaseOrdersList(page, limit, storeId);
    }

    let supabaseQuery = client
      .from('purchase_orders')
      .select(
        `
        id,
        store_id,
        supplier_id,
        order_number,
        order_date,
        expected_delivery_date,
        status,
        subtotal,
        tax_amount,
        total_amount,
        approved_by,
        approved_at,
        notes,
        created_at,
        updated_at,
        suppliers (
          name
        ),
        users (
          name
        ),
        purchase_order_items (
          id
        )
      `,
        { count: 'exact' },
      )
      .eq('store_id', storeId)
      .is('deleted_at', null);

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    } else if (query.tab === 'active') {
      supabaseQuery = supabaseQuery.not('status', 'in', '("received","cancelled")');
    } else if (query.tab === 'history') {
      supabaseQuery = supabaseQuery.in('status', ['received', 'cancelled']);
    }

    if (query.supplierId) {
      supabaseQuery = supabaseQuery.eq('supplier_id', query.supplierId);
    }

    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('order_date', query.startDate);
    }

    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('order_date', query.endDate);
    }

    supabaseQuery = supabaseQuery.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await supabaseQuery;

    if (error) {
      this.logger.error(`Failed to retrieve purchase orders: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve purchase orders');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const items: PurchaseOrderResponseDto[] = (data || []).map((row: any) => {
      const supplier = row.suppliers;
      const approver = row.users;
      const poItems = row.purchase_order_items || [];

      return {
        id: row.id,
        storeId: row.store_id,
        supplierId: row.supplier_id,
        supplierName: supplier?.name,
        orderNumber: row.order_number,
        orderDate: row.order_date,
        expectedDeliveryDate: row.expected_delivery_date,
        status: row.status as PurchaseOrderStatus,
        subtotal: Number(row.subtotal),
        taxAmount: Number(row.tax_amount),
        totalAmount: Number(row.total_amount),
        itemCount: poItems.length,
        approvedBy: row.approved_by,
        approvedByName: approver?.name,
        approvedAt: row.approved_at,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
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
   * Find single Purchase Order detail with line items.
   */
  async findPurchaseOrderById(
    id: string,
    storeId: string,
  ): Promise<PurchaseOrderDetailResponseDto | null> {
    this.logger.log(`ProcurementRepository.findPurchaseOrderById: ${id} in store=${storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockPurchaseOrderDetail(id, storeId);
    }

    const { data: po, error: poError } = await client
      .from('purchase_orders')
      .select(
        `
        id,
        store_id,
        supplier_id,
        order_number,
        order_date,
        expected_delivery_date,
        status,
        subtotal,
        tax_amount,
        total_amount,
        approved_by,
        approved_at,
        notes,
        created_at,
        updated_at,
        suppliers (
          name
        ),
        users (
          name
        )
      `,
      )
      .eq('id', id)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    if (poError || !po) {
      return null;
    }

    const { data: items } = await client
      .from('purchase_order_items')
      .select(
        `
        id,
        purchase_order_id,
        item_id,
        quantity_ordered,
        quantity_received,
        unit,
        unit_price,
        total_price,
        inventory_items (
          sku,
          name
        )
      `,
      )
      .eq('purchase_order_id', id);

    const supplier = po.suppliers as any;
    const approver = po.users as any;

    const poItems: PurchaseOrderItemResponseDto[] = (items || []).map((i: any) => {
      const inv = i.inventory_items;
      return {
        id: i.id,
        poId: i.purchase_order_id,
        itemId: i.item_id,
        sku: inv?.sku || '',
        name: inv?.name || '',
        quantityOrdered: Number(i.quantity_ordered),
        quantityReceived: Number(i.quantity_received || 0),
        unit: i.unit,
        unitPrice: Number(i.unit_price),
        totalPrice: Number(i.total_price),
      };
    });

    return {
      id: po.id,
      storeId: po.store_id,
      supplierId: po.supplier_id,
      supplierName: supplier?.name,
      orderNumber: po.order_number,
      orderDate: po.order_date,
      expectedDeliveryDate: po.expected_delivery_date,
      status: po.status as PurchaseOrderStatus,
      subtotal: Number(po.subtotal),
      taxAmount: Number(po.tax_amount),
      totalAmount: Number(po.total_amount),
      itemCount: poItems.length,
      approvedBy: po.approved_by,
      approvedByName: approver?.name,
      approvedAt: po.approved_at,
      notes: po.notes,
      createdAt: po.created_at,
      updatedAt: po.updated_at,
      items: poItems,
    };
  }

  /**
   * Create new Purchase Order in 'draft' status.
   */
  async createPurchaseOrder(
    dto: CreatePurchaseOrderDto,
    storeId: string,
    actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    this.logger.log(`ProcurementRepository.createPurchaseOrder: store=${storeId}, supplier=${dto.supplierId}`);
    const client = this.supabaseService.getAdminClient();

    const orderNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    let subtotal = 0;
    const itemCalculations = dto.items.map((i) => {
      const lineTotal = Math.round(i.quantityOrdered * i.unitPrice * 100) / 100;
      subtotal += lineTotal;
      return { ...i, totalPrice: lineTotal };
    });

    const taxAmount = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
    const totalAmount = subtotal + taxAmount;

    if (!client) {
      return {
        id: '01915dfa-b1c4-7221-9988-000000000055',
        storeId,
        supplierId: dto.supplierId,
        supplierName: 'Fresh Farms Direct',
        orderNumber,
        orderDate: dto.orderDate,
        expectedDeliveryDate: dto.expectedDeliveryDate,
        status: 'draft',
        subtotal,
        taxAmount,
        totalAmount,
        itemCount: dto.items.length,
        notes: dto.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: itemCalculations.map((i, idx) => ({
          id: `po-item-${idx}`,
          poId: '01915dfa-b1c4-7221-9988-000000000055',
          itemId: i.itemId,
          sku: 'SKU-001',
          name: 'Item',
          quantityOrdered: i.quantityOrdered,
          quantityReceived: 0,
          unit: i.unit,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
      };
    }

    // 1. Insert PO Header
    const { data: createdPo, error: poError } = await client
      .from('purchase_orders')
      .insert({
        store_id: storeId,
        supplier_id: dto.supplierId,
        order_number: orderNumber,
        order_date: dto.orderDate,
        expected_delivery_date: dto.expectedDeliveryDate,
        status: 'draft',
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: dto.notes,
        created_by: actorId,
        updated_by: actorId,
      })
      .select('*')
      .single();

    if (poError || !createdPo) {
      this.logger.error(`Failed to create purchase order: ${poError?.message}`);
      throw new InternalServerErrorException('Failed to create purchase order');
    }

    // 2. Insert PO Line Items
    const linePayload = itemCalculations.map((i) => ({
      purchase_order_id: createdPo.id,
      item_id: i.itemId,
      quantity_ordered: i.quantityOrdered,
      quantity_received: 0,
      unit: i.unit,
      unit_price: i.unitPrice,
      total_price: i.totalPrice,
    }));

    const { error: linesError } = await client.from('purchase_order_items').insert(linePayload);

    if (linesError) {
      this.logger.error(`Failed to create PO items: ${linesError.message}`);
      throw new InternalServerErrorException('Failed to create purchase order items');
    }

    return this.findPurchaseOrderById(createdPo.id, storeId) as Promise<PurchaseOrderDetailResponseDto>;
  }

  /**
   * Update Purchase Order (allowed when draft).
   */
  async updatePurchaseOrder(
    id: string,
    dto: UpdatePurchaseOrderDto,
    storeId: string,
    actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      return this.findPurchaseOrderById(id, storeId) as Promise<PurchaseOrderDetailResponseDto>;
    }

    const payload: Record<string, any> = {
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    };

    if (dto.supplierId) payload.supplier_id = dto.supplierId;
    if (dto.orderDate) payload.order_date = dto.orderDate;
    if (dto.expectedDeliveryDate) payload.expected_delivery_date = dto.expectedDeliveryDate;
    if (dto.notes !== undefined) payload.notes = dto.notes;

    if (dto.items && dto.items.length > 0) {
      let subtotal = 0;
      const itemCalculations = dto.items.map((i) => {
        const lineTotal = Math.round(i.quantityOrdered * i.unitPrice * 100) / 100;
        subtotal += lineTotal;
        return { ...i, totalPrice: lineTotal };
      });
      const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
      payload.subtotal = subtotal;
      payload.tax_amount = taxAmount;
      payload.total_amount = subtotal + taxAmount;

      // Replace items
      await client.from('purchase_order_items').delete().eq('purchase_order_id', id);

      const linePayload = itemCalculations.map((i) => ({
        purchase_order_id: id,
        item_id: i.itemId,
        quantity_ordered: i.quantityOrdered,
        quantity_received: 0,
        unit: i.unit,
        unit_price: i.unitPrice,
        total_price: i.totalPrice,
      }));
      await client.from('purchase_order_items').insert(linePayload);
    }

    await client.from('purchase_orders').update(payload).eq('id', id).eq('store_id', storeId);

    return this.findPurchaseOrderById(id, storeId) as Promise<PurchaseOrderDetailResponseDto>;
  }

  /**
   * Update status during state machine transitions.
   */
  async updatePurchaseOrderStatus(
    id: string,
    storeId: string,
    status: PurchaseOrderStatus,
    auditData?: {
      actorId: string;
      reason?: string;
    },
  ): Promise<void> {
    this.logger.log(`ProcurementRepository.updatePurchaseOrderStatus: id=${id}, toStatus=${status}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const now = new Date().toISOString();
    const payload: Record<string, any> = {
      status,
      updated_at: now,
    };

    if (auditData?.actorId) {
      payload.updated_by = auditData.actorId;
    }

    if (status === 'submitted') {
      payload.submitted_by = auditData?.actorId;
      payload.submitted_at = now;
    } else if (status === 'approved') {
      payload.approved_by = auditData?.actorId;
      payload.approved_at = now;
    } else if (status === 'cancelled') {
      payload.cancelled_by = auditData?.actorId;
      payload.cancelled_at = now;
      payload.cancellation_reason = auditData?.reason;
    }

    const { error } = await client
      .from('purchase_orders')
      .update(payload)
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) {
      this.logger.error(`Failed to update purchase order status: ${error.message}`);
      throw new InternalServerErrorException('Failed to update purchase order status');
    }
  }

  /**
   * List Goods Receipts with pagination.
   */
  async findGoodsReceipts(
    query: QueryGoodsReceiptsDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<GoodsReceiptResponseDto>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockGoodsReceiptsList(page, limit, storeId);
    }

    let supabaseQuery = client
      .from('goods_receipts')
      .select(
        `
        id,
        store_id,
        purchase_order_id,
        supplier_id,
        receipt_number,
        invoice_number,
        receipt_date,
        total_amount,
        status,
        received_by,
        notes,
        created_at,
        updated_at,
        suppliers (
          name
        ),
        purchase_orders (
          order_number
        ),
        users (
          name
        ),
        goods_receipt_items (
          id
        )
      `,
        { count: 'exact' },
      )
      .eq('store_id', storeId);

    if (query.supplierId) {
      supabaseQuery = supabaseQuery.eq('supplier_id', query.supplierId);
    }

    if (query.poId) {
      supabaseQuery = supabaseQuery.eq('purchase_order_id', query.poId);
    }

    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('receipt_date', query.startDate);
    }

    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('receipt_date', query.endDate);
    }

    supabaseQuery = supabaseQuery.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await supabaseQuery;

    if (error) {
      this.logger.error(`Failed to retrieve goods receipts: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve goods receipts');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const items: GoodsReceiptResponseDto[] = (data || []).map((row: any) => {
      const supplier = row.suppliers;
      const po = row.purchase_orders;
      const receiver = row.users;
      const grItems = row.goods_receipt_items || [];

      return {
        id: row.id,
        storeId: row.store_id,
        receiptNumber: row.receipt_number,
        invoiceNumber: row.invoice_number,
        poId: row.purchase_order_id,
        poOrderNumber: po?.order_number,
        supplierId: row.supplier_id,
        supplierName: supplier?.name,
        receiptDate: row.receipt_date,
        totalAmount: Number(row.total_amount),
        status: row.status,
        itemCount: grItems.length,
        receivedBy: row.received_by,
        receivedByName: receiver?.name,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
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
   * Get single Goods Receipt detail.
   */
  async findGoodsReceiptById(
    id: string,
    storeId: string,
  ): Promise<GoodsReceiptDetailResponseDto | null> {
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockGoodsReceiptDetail(id, storeId);
    }

    const { data: gr, error } = await client
      .from('goods_receipts')
      .select(
        `
        id,
        store_id,
        purchase_order_id,
        supplier_id,
        receipt_number,
        invoice_number,
        receipt_date,
        total_amount,
        status,
        received_by,
        notes,
        created_at,
        updated_at,
        suppliers (
          name
        ),
        purchase_orders (
          order_number
        ),
        users (
          name
        )
      `,
      )
      .eq('id', id)
      .eq('store_id', storeId)
      .single();

    if (error || !gr) return null;

    const { data: items } = await client
      .from('goods_receipt_items')
      .select(
        `
        id,
        goods_receipt_id,
        item_id,
        po_item_id,
        quantity_received,
        unit,
        price_per_unit,
        total_price,
        batch_number,
        expiry_date,
        inventory_items (
          sku,
          name
        )
      `,
      )
      .eq('goods_receipt_id', id);

    const supplier = gr.suppliers as any;
    const po = gr.purchase_orders as any;
    const receiver = gr.users as any;

    const grItems: GoodsReceiptItemResponseDto[] = (items || []).map((i: any) => {
      const inv = i.inventory_items;
      return {
        id: i.id,
        goodsReceiptId: i.goods_receipt_id,
        itemId: i.item_id,
        sku: inv?.sku || '',
        name: inv?.name || '',
        poItemId: i.po_item_id,
        quantityReceived: Number(i.quantity_received),
        unit: i.unit,
        pricePerUnit: Number(i.price_per_unit),
        totalPrice: Number(i.total_price),
        batchNumber: i.batch_number,
        expiryDate: i.expiry_date,
      };
    });

    return {
      id: gr.id,
      storeId: gr.store_id,
      receiptNumber: gr.receipt_number,
      invoiceNumber: gr.invoice_number,
      poId: gr.purchase_order_id,
      poOrderNumber: po?.order_number,
      supplierId: gr.supplier_id,
      supplierName: supplier?.name,
      receiptDate: gr.receipt_date,
      totalAmount: Number(gr.total_amount),
      status: gr.status,
      itemCount: grItems.length,
      receivedBy: gr.received_by,
      receivedByName: receiver?.name,
      notes: gr.notes,
      createdAt: gr.created_at,
      updatedAt: gr.updated_at,
      items: grItems,
    };
  }

  /**
   * Create Goods Receipt, update physical stocks, add FEFO batches, and sync ledger.
   */
  async createGoodsReceipt(
    dto: CreateGoodsReceiptDto,
    storeId: string,
    actorId: string,
  ): Promise<GoodsReceiptDetailResponseDto> {
    this.logger.log(`ProcurementRepository.createGoodsReceipt: store=${storeId}, PO=${dto.poId}`);
    const client = this.supabaseService.getAdminClient();

    const receiptNumber = `GR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    let totalAmount = 0;
    const itemCalculations = dto.items.map((i) => {
      const lineTotal = Math.round(i.quantityReceived * i.pricePerUnit * 100) / 100;
      totalAmount += lineTotal;
      return { ...i, totalPrice: lineTotal };
    });

    if (!client) {
      return {
        id: 'gr-mock-01',
        storeId,
        receiptNumber,
        invoiceNumber: dto.invoiceNumber,
        poId: dto.poId,
        poOrderNumber: 'PO-20260820-001',
        supplierId: dto.supplierId,
        supplierName: 'Fresh Farms Direct',
        receiptDate: dto.receiptDate,
        totalAmount,
        status: 'verified',
        itemCount: dto.items.length,
        receivedBy: actorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: itemCalculations.map((i, idx) => ({
          id: `gr-item-${idx}`,
          goodsReceiptId: 'gr-mock-01',
          itemId: i.itemId,
          sku: 'SKU-001',
          name: 'Item',
          poItemId: i.poItemId,
          quantityReceived: i.quantityReceived,
          unit: i.unit,
          pricePerUnit: i.pricePerUnit,
          totalPrice: i.totalPrice,
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate,
        })),
      };
    }

    const now = new Date().toISOString();

    // 1. Insert Goods Receipt
    const { data: createdGr, error: grError } = await client
      .from('goods_receipts')
      .insert({
        store_id: storeId,
        purchase_order_id: dto.poId,
        supplier_id: dto.supplierId,
        receipt_number: receiptNumber,
        invoice_number: dto.invoiceNumber,
        receipt_date: dto.receiptDate,
        total_amount: totalAmount,
        status: 'verified',
        received_by: actorId,
        notes: dto.notes,
        created_by: actorId,
        updated_by: actorId,
      })
      .select('*')
      .single();

    if (grError || !createdGr) {
      this.logger.error(`Failed to create goods receipt: ${grError?.message}`);
      throw new InternalServerErrorException('Failed to create goods receipt');
    }

    // 2. Process each item: insert GR line, insert batch (FEFO), update stock, record transaction ledger
    for (const item of itemCalculations) {
      await client.from('goods_receipt_items').insert({
        goods_receipt_id: createdGr.id,
        item_id: item.itemId,
        po_item_id: item.poItemId,
        quantity_received: item.quantityReceived,
        unit: item.unit,
        price_per_unit: item.pricePerUnit,
        total_price: item.totalPrice,
        batch_number: item.batchNumber,
        expiry_date: item.expiryDate,
      });

      // Insert FEFO batch
      await client.from('inventory_batches').insert({
        item_id: item.itemId,
        store_id: storeId,
        batch_number: item.batchNumber,
        quantity: item.quantityReceived,
        cost_per_unit: item.pricePerUnit,
        expiry_date: item.expiryDate,
        received_date: dto.receiptDate,
        status: 'active',
      });

      // Fetch current physical stock
      const { data: invItem } = await client
        .from('inventory_items')
        .select('physical_stock, theoretical_stock')
        .eq('id', item.itemId)
        .eq('store_id', storeId)
        .single();

      const prevStock = Number(invItem?.physical_stock || 0);
      const newStock = prevStock + item.quantityReceived;

      // Update physical stock balance
      await client
        .from('inventory_items')
        .update({
          physical_stock: newStock,
          theoretical_stock: Number(invItem?.theoretical_stock || 0) + item.quantityReceived,
          cost_per_unit: item.pricePerUnit,
          updated_by: actorId,
          updated_at: now,
        })
        .eq('id', item.itemId)
        .eq('store_id', storeId);

      // Record transaction ledger
      const txNumber = `REC-${now.slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      await client.from('inventory_transactions').insert({
        store_id: storeId,
        item_id: item.itemId,
        transaction_number: txNumber,
        transaction_type: 'PURCHASE_RECEIPT',
        delta: item.quantityReceived,
        previous_stock: prevStock,
        new_stock: newStock,
        cost_impact: item.totalPrice,
        actor_id: actorId,
        reference_type: 'GOODS_RECEIPT',
        reference_id: createdGr.id,
        note: `Goods Receipt (${dto.invoiceNumber})`,
      });

      // If linked to PO Item, update quantity_received in purchase_order_items
      if (item.poItemId) {
        await client
          .from('purchase_order_items')
          .update({ quantity_received: item.quantityReceived })
          .eq('id', item.poItemId);
      }
    }

    // 3. If linked to PO, transition PO to 'received'
    if (dto.poId) {
      await this.updatePurchaseOrderStatus(dto.poId, storeId, 'received', { actorId });
    }

    return this.findGoodsReceiptById(createdGr.id, storeId) as Promise<GoodsReceiptDetailResponseDto>;
  }

  private buildMockPurchaseOrdersList(
    page: number,
    limit: number,
    storeId: string,
  ): PaginatedResponseDto<PurchaseOrderResponseDto> {
    const mockList: PurchaseOrderResponseDto[] = [
      {
        id: '01915dfa-b1c4-7221-9988-000000000055',
        storeId,
        supplierId: 'sup-01',
        supplierName: 'Fresh Farms Direct',
        orderNumber: 'PO-20260820-001',
        orderDate: '2026-08-20',
        expectedDeliveryDate: '2026-08-22',
        status: 'draft',
        subtotal: 150.0,
        taxAmount: 15.0,
        totalAmount: 165.0,
        itemCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return {
      data: mockList,
      meta: {
        page,
        limit,
        total: mockList.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  private buildMockPurchaseOrderDetail(
    id: string,
    storeId: string,
  ): PurchaseOrderDetailResponseDto {
    return {
      id,
      storeId,
      supplierId: 'sup-01',
      supplierName: 'Fresh Farms Direct',
      orderNumber: 'PO-20260820-001',
      orderDate: '2026-08-20',
      expectedDeliveryDate: '2026-08-22',
      status: 'draft',
      subtotal: 150.0,
      taxAmount: 15.0,
      totalAmount: 165.0,
      itemCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: 'poi-01',
          poId: id,
          itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
          sku: 'DAI-001',
          name: 'Whole Milk 3.5%',
          quantityOrdered: 40,
          quantityReceived: 0,
          unit: 'L',
          unitPrice: 1.25,
          totalPrice: 50.0,
        },
      ],
    };
  }

  private buildMockGoodsReceiptsList(
    page: number,
    limit: number,
    storeId: string,
  ): PaginatedResponseDto<GoodsReceiptResponseDto> {
    const mockList: GoodsReceiptResponseDto[] = [
      {
        id: 'gr-01',
        storeId,
        receiptNumber: 'GR-20260820-001',
        invoiceNumber: 'INV-9921',
        poId: '01915dfa-b1c4-7221-9988-000000000055',
        poOrderNumber: 'PO-20260820-001',
        supplierId: 'sup-01',
        supplierName: 'Fresh Farms Direct',
        receiptDate: '2026-08-20',
        totalAmount: 165.0,
        status: 'verified',
        itemCount: 1,
        receivedBy: 'user-01',
        receivedByName: 'Mario Batali',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return {
      data: mockList,
      meta: {
        page,
        limit,
        total: mockList.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  private buildMockGoodsReceiptDetail(
    id: string,
    storeId: string,
  ): GoodsReceiptDetailResponseDto {
    return {
      id,
      storeId,
      receiptNumber: 'GR-20260820-001',
      invoiceNumber: 'INV-9921',
      poId: '01915dfa-b1c4-7221-9988-000000000055',
      poOrderNumber: 'PO-20260820-001',
      supplierId: 'sup-01',
      supplierName: 'Fresh Farms Direct',
      receiptDate: '2026-08-20',
      totalAmount: 165.0,
      status: 'verified',
      itemCount: 1,
      receivedBy: 'user-01',
      receivedByName: 'Mario Batali',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: 'gri-01',
          goodsReceiptId: id,
          itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
          sku: 'DAI-001',
          name: 'Whole Milk 3.5%',
          quantityReceived: 40,
          unit: 'L',
          pricePerUnit: 1.25,
          totalPrice: 50.0,
          batchNumber: 'LOT-20260820',
          expiryDate: '2026-09-10',
        },
      ],
    };
  }

  async getPOQRecommendations(storeId: string) {
    const client = this.supabaseService.getAdminClient();
    if (!client) return [];

    const { data: items } = await client
      .from('inventory_items')
      .select('id, name, sku, unit, physical_stock, target_stock, safety_stock, cost_per_unit, supplier_id, suppliers(id, name, email)')
      .eq('store_id', storeId)
      .is('deleted_at', null);

    const supplierGroups: Record<string, any> = {};

    (items || []).forEach((item: any) => {
      const physical = Number(item.physical_stock || 0);
      const target = Number(item.target_stock || 0);
      const safety = Number(item.safety_stock || 0);
      const poq = Math.max(0, parseFloat((target - physical + safety).toFixed(1)));
      const cost = Number(item.cost_per_unit || 0);

      const supId = item.suppliers?.id || item.supplier_id || 'sup-default';
      const supName = item.suppliers?.name || 'Default Supplier';

      if (!supplierGroups[supId]) {
        supplierGroups[supId] = {
          supplierId: supId,
          supplierName: supName,
          email: item.suppliers?.email || 'orders@supplier.com',
          minOrderValue: 100.0,
          totalValue: 0,
          itemCount: 0,
          items: [],
        };
      }

      supplierGroups[supId].items.push({
        id: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        currentStock: physical,
        targetStock: target,
        safetyStock: safety,
        suggestedQty: poq > 0 ? poq : 10,
        pricePerUnit: cost,
        totalCost: parseFloat(((poq > 0 ? poq : 10) * cost).toFixed(2)),
      });

      supplierGroups[supId].totalValue += (poq > 0 ? poq : 10) * cost;
      supplierGroups[supId].itemCount += 1;
    });

    return Object.values(supplierGroups);
  }
}
