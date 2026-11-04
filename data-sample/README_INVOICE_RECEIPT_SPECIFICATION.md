# StockPulse Mobile — F&B Operational Invoices, Receipts & Waste Control Specification

> **Design Philosophy**: Built for everyday frontline kitchen staff—**Storekeepers, Chefs, Shift Leads, and Store Managers**.  
> The system replaces heavyweight 3-way accounting reconciliation matrices with **tactile, practical mobile workflows**: immediate Skip Debt Deductions at the loading dock, automatic Recipe Bill of Materials (BOM) inventory depletion on sales, and instant kitchen loss & void tracking.

---

## Document Overview & Export Packages

| Exported File | Document / Ledger Type | Primary Role | Core Mobile Action | Physical Inventory & Debt Impact |
|---|---|---|---|---|
| [`StockPulse_F&B_Sample_Reports.xlsx`](./StockPulse_F&B_Sample_Reports.xlsx) | **Executive Master Excel Workbook (7 Sheets)** | Store Manager / Auditor | Multi-tab workbook with KPI dashboard & formula sums | Consolidates all operational and receiving ledgers |
| [`sample_reports_bundle.json`](./sample_reports_bundle.json) | **JSON Export Bundle** | Mobile App / API | Programmatic fixture for mobile app, unit & e2e tests | Full typed JSON payload covering all datasets & KPIs |
| [`sample_supplier_delivery_invoice.csv`](./sample_supplier_delivery_invoice.csv) | **Supplier Delivery Invoice** (`supplier_delivery`) | Storekeeper / Chef | Verify delivery, log shorted/damaged items via **Skip Control** | Restocks accepted items; auto-deducts rejected goods from supplier debt |
| [`sample_pos_order_form_receipt.csv`](./sample_pos_order_form_receipt.csv) | **Sales Invoice / POS Receipt** (`order_receipt`) | Cashier / Storekeeper | Process shift register sales or customer meal orders | Explodes recipe BOM to atomically deplete raw ingredient stock |
| [`sample_kitchen_waste_spoilage.csv`](./sample_kitchen_waste_spoilage.csv) | **Food Loss & Spoilage Log** (`food_loss`) | Chef / Prep Cook | Log kitchen line drops, BBD expiration, and butchery trim loss | Instantly reduces physical on-hand stock and logs monetary waste cost |
| [`sample_kitchen_cancellations.csv`](./sample_kitchen_cancellations.csv) | **Kitchen Cancellation / Void** (`kitchen_void`) | Chef / Floor Lead | Record cancelled orders, distinguishing prepped vs pre-cook voids | Tracks waste cost for cooked dishes; saves €0.00 waste if voided before cooking |
| [`sample_goods_delivery_note.csv`](./sample_goods_delivery_note.csv) | **Goods Delivery Note (Dock Slip)** (`delivery_note`) | Storekeeper | Unload truck, check temperature, driver sign-off | Validates inbound physical delivery before invoice matching |
| [`poq_order_quantity_setup_template.csv`](./poq_order_quantity_setup_template.csv) | **POQ Replenishment Setup** (`poq_setup`) | Store Manager | Configure par levels, safety stock, and vendor delivery lead times | Automatically calculates suggested reorder quantities for purchasing |

---

## 1. Delivery Invoice from Supplier with Skip Control

### The "Skip Control" Workflow for Storekeepers & Chefs
Traditional accounting requires raising formal credit dispute notes and waiting weeks for vendor reconciliation. In StockPulse:
1. When goods arrive damaged, rotten, or shorted at the receiving dock, the storekeeper taps **`+ Deduct Skip / Damaged Goods`**.
2. Staff enter the deduction amount and the reason (e.g., *1.5 kg salmon package punctured in transit*).
3. The app immediately updates the financial balance:
   $$\text{Net Debt to Supplier} = \text{Gross Invoiced} - \text{Skip Shortage Deduction}$$
4. The payment action adjusts in real time to **`Record Payment (€Net)`**, preventing overpayment to the vendor.

### CSV & Service Schema (`sample_supplier_delivery_invoice.csv`)

| Field Name | Type | Example | Description |
|---|---|---|---|
| `invoice_number` | String | `INV-20479` | Vendor invoice identifier |
| `invoice_date` | Date | `2026-03-09` | Date billed by vendor |
| `due_date` | Date | `2026-03-23` | Payment deadline |
| `supplier_name` | String | `FreshProduce GmbH` | Vendor name |
| `supplier_tax_id` | String | `DE554433221` | Vendor VAT / Tax ID |
| `purchase_order_ref` | String | `PO-2026-003` | Optional reference to purchase order |
| `delivery_note_ref` | String | `DN-20479` | Optional reference to receiving dock slip |
| `item_sku` | String | `SAL-002` | Item SKU code |
| `item_description` | String | `Fresh Atlantic Salmon Portion` | Description of line item |
| `invoiced_qty` | Number | `6.00` | Quantity billed by vendor |
| `received_qty` | Number | `4.50` | Quantity physically accepted into walk-in |
| `unit_of_measure` | String | `kg` | Measurement unit (`kg`, `L`, `pcs`) |
| `unit_price_excl_vat` | Currency | `16.20` | Unit price in EUR excluding VAT |
| `vat_rate_pct` | Number | `7.0` | Statutory VAT rate percentage |
| `gross_line_total_eur` | Currency | `103.96` | Line gross total including VAT |
| `skip_deduction_amount_eur` | Currency | `24.30` | **Skip Control**: Deducted debt for rejected or shorted goods |
| `skip_deduction_reason` | String | `1.5kg salmon damaged in transit` | Operational justification entered by receiving staff |
| `net_payable_debt_eur` | Currency | `79.66` | Net debt owed to supplier after skip deduction |
| `payment_status` | Enum | `unpaid` \| `paid` | Current settlement status |
| `verified_by` | String | `Marco Bauer` | Staff member who validated delivery |
| `haccp_probe_temp_c` | String | `+2.8` | Cold-chain receiving temperature check |
| `notes` | String | `Skip deduction settled at door` | Additional dock notes |

---

## 2. Sales Invoices & POS Register Receipts

### Automated Recipe BOM Inventory Depletion
When front-of-house registers close shifts or process customer meal orders:
1. The app identifies sold menu items (e.g., `Menu 1 — Chicken Plate`, `Burger XL Deluxe`).
2. The **Bill of Materials (BOM) engine** automatically calculates the required raw materials:
   $$\text{Deducted Qty} = \text{Sold Portions} \times \text{Ingredient Quantity per Serving} \times (1 + \text{Waste Factor})$$
3. Raw stock balances (chicken fillets, cooking oil, tomatoes) are atomically deducted from active storage bins.

### CSV & Service Schema (`sample_pos_order_form_receipt.csv`)

| Field Name | Type | Example | Description |
|---|---|---|---|
| `receipt_number` | String | `REC-2026-8801` | POS register transaction / ticket number |
| `order_timestamp` | DateTime | `2026-03-10 12:34:10` | Date and time of sale |
| `pos_terminal_id` | String | `POS-FRONT-01` | FOH register terminal identifier |
| `cashier_server_name` | String | `Marco Rossi` | Server or cashier staff name |
| `table_service_type` | String | `Table 12 (Dine-In)` | Table number or order type |
| `payment_method` | String | `Credit Card` | Payment tender (`Cash`, `Credit Card`, `Apple Pay`) |
| `menu_item_name` | String | `Menu 1 — Chicken Plate` | Sold dish title |
| `recipe_code` | String | `REC-CHK-01` | Recipe catalog link for BOM explosion |
| `portion_qty_sold` | Integer | `2` | Number of servings sold |
| `menu_selling_price_eur` | Currency | `16.50` | Selling price per dish |
| `gross_sales_eur` | Currency | `33.00` | Total sales revenue |
| `vat_rate_pct` | Number | `19.0` | Hospitality VAT percentage |
| `bom_ingredient_sku` | String | `CHK-001` | Depleted raw ingredient SKU |
| `bom_ingredient_name` | String | `Chicken Breast (Fresh)` | Depleted raw ingredient name |
| `deduction_qty_per_portion` | Number | `0.20` | BOM ingredient mass/volume per portion |
| `total_ingredient_deducted` | Number | `0.40` | Exact mass/volume deducted from warehouse (`kg`, `L`) |
| `ingredient_unit` | String | `kg` | Measurement unit |
| `waste_factor_pct` | Number | `5.0` | Cook/trim yield allowance configured in recipe |
| `theoretical_cost_per_serving` | Currency | `3.42` | Theoretical food cost per portion |
| `inventory_sync_status` | String | `Synchronized` | Sync state with warehouse balances |

---

## 3. Kitchen Loss Logs & Dish Cancellations

### Fast 2-Tap Kitchen Waste Tracking
In busy commercial kitchens, chefs do not fill out administrative audit forms. StockPulse provides a dedicated **`Loss & Cancellations`** mobile interface with two streamlined tabs:

### Tab A: Food Loss & Spoilage (`sample_kitchen_waste_spoilage.csv`)
Used for discarding raw ingredients before or during preparation:
* **Dropped / Overdone**: Food dropped on the floor or overcooked during rush hours.
* **Expired BBD**: Perishable items that exceeded safe shelf-life windows.
* **Prep Trimming**: Butchery sinew, vegetable peeling, or prep trimming exceeding standard yield.
* **Action**: Tapping `Deduct Stock` immediately subtracts the discarded quantity from live physical inventory and logs the waste cost.

| Field Name | Type | Example | Description |
|---|---|---|---|
| `waste_log_id` | String | `WST-2026-041` | Unique food waste log ID |
| `log_timestamp` | DateTime | `2026-03-11 14:20:00` | Incident occurrence timestamp |
| `reporting_station` | String | `Hot Kitchen Line 1` | Station where loss occurred |
| `logged_by_staff` | String | `Marco Rossi` | Cook or chef logging the discard |
| `item_sku` | String | `CHK-001` | Raw ingredient SKU |
| `item_description` | String | `Fresh Chicken Breast Fillet` | Ingredient name |
| `wasted_quantity` | Number | `0.80` | Quantity discarded |
| `unit_of_measure` | String | `kg` | Measurement unit |
| `waste_category` | Enum | `cooking_dropped`, `spoilage_expired`, `prep_trimming` | Categorization code |
| `unit_cost_eur` | Currency | `4.80` | Cost per unit in EUR |
| `total_loss_cost_eur` | Currency | `3.84` | Total monetary loss in EUR |
| `notes` | String | `Line dropped during peak lunch rush` | Operational context |

### Tab B: Kitchen Voids & Cancellations (`sample_kitchen_cancellations.csv`)
Used when orders are rung up, but cancelled by guests or due to service delays:
* **Prepped & Discarded**: The dish was already cooked or plated when cancelled. The full recipe ingredient cost is recorded as **Kitchen Waste Loss**.
* **Voided Before Cooking (Saved)**: The server cancelled the ticket before the hot line fired the order. Ingredients were preserved, logging **€0.00 waste** and marking the order as **Saved Void**.

| Field Name | Type | Example | Description |
|---|---|---|---|
| `cancellation_id` | String | `CANC-8802` | Unique cancellation ticket ID |
| `ticket_number` | String | `TKT-8802` | Original POS order ticket reference |
| `table_or_location` | String | `Table 14` | Table or delivery channel |
| `dish_name` | String | `Grilled Chicken Breast Plate` | Cancelled menu dish |
| `recipe_code` | String | `REC-CHK-01` | Recipe catalog link |
| `portions_cancelled` | Integer | `1` | Cancelled portion count |
| `cancellation_reason` | Enum | `guest_cancelled`, `wrong_order`, `kitchen_delay` | Operational void reason |
| `is_cooked_in_kitchen` | Boolean | `true` \| `false` | Whether food was already prepared/fired |
| `monetary_loss_cost_eur` | Currency | `3.42` | Total waste cost (€0.00 if saved before cooking) |
| `outcome_status` | Enum | `Prepped & Discarded` \| `Voided Before Cooking (Saved)` | Waste outcome status |
| `logged_by_staff` | String | `Marco Rossi` | Staff member logging cancellation |
| `cancellation_timestamp` | DateTime | `2026-03-11 13:45:00` | Timestamp of void |
| `notes` | String | `Customer walked out due to emergency; chicken already plated` | Context notes |

---

## 4. Goods Delivery Note / Receiving Slip (`sample_goods_delivery_note.csv`)

Inbound physical dock receiving slips (*Lieferschein*) checked during delivery truck unloading:
- **Vehicle & Bay**: Transport license plate, carrier name, unloading bay.
- **Count Check**: Ordered vs Delivered vs Accepted vs Rejected packages.
- **HACCP Temperature Gate**: Core temperature check (e.g., `<+4.0°C` for poultry, `<+2.0°C` for fresh fish).
- **Driver Sign-Off**: Quick digital signature before goods are placed in walk-in coolers.

| Field Name | Type | Example | Description |
|---|---|---|---|
| `delivery_note_number` | String | `DN-20481` | Dock delivery note identifier |
| `delivery_date` | Date | `2026-03-08` | Delivery arrival date |
| `delivery_time` | Time | `08:30:00` | Delivery arrival time |
| `supplier_name` | String | `Metro Foods GmbH` | Supplier name |
| `carrier_transport_company` | String | `FrischeLogistik Express` | Freight / logistics carrier |
| `driver_name` | String | `Hans Meier` | Delivery driver name |
| `vehicle_plate_number` | String | `B-ML-4412` | Delivery vehicle license plate |
| `receiving_bay` | String | `Bay 1 (Refrigerated)` | Unloading dock bay |
| `receiving_staff_name` | String | `Anna Schmidt` | Receiving staff member |
| `purchase_order_ref` | String | `PO-2026-001` | Purchase order reference |
| `item_sku` | String | `CHK-001` | Received item SKU |
| `item_description` | String | `Chicken Breast Fillet (Fresh)` | Item description |
| `ordered_qty` | Number | `20.0` | Quantity ordered |
| `delivered_qty` | Number | `20.0` | Quantity offloaded from truck |
| `accepted_qty` | Number | `20.0` | Quantity accepted into stock |
| `rejected_qty` | Number | `0.0` | Quantity rejected on dock |
| `unit_of_measure` | String | `kg` | Measurement unit |
| `rejection_reason` | String | `None` | Dock rejection explanation |
| `batch_lot_number` | String | `LOT-CHK-20260308-A` | Supplier batch number |
| `bbd_expiry_date` | Date | `2026-03-18` | Best-before date on packaging |
| `haccp_core_temperature_c` | String | `+3.4` | Temperature probe reading on dock |
| `storage_zone_destination` | String | `Cold Room 1` | Destination storage bin/shelf |
| `supplier_sign_off` | String | `Signed` | Driver signature indicator |
| `receiver_sign_off` | String | `Signed` | Receiver signature indicator |

---

## 5. Automated POQ Reorder Calculation (`poq_order_quantity_setup_template.csv`)

To keep purchasing simple for managers and storekeepers without statistical forecasting overhead:
$$\text{Suggested Order Qty} = \max\left(0, \text{Par Level} - \text{On Hand Stock} + \text{Event Reservations} + (\text{Daily Usage} \times \text{Lead Time Days})\right)$$

| Field Name | Type | Example | Description |
|---|---|---|---|
| `item_sku` | String | `CHK-001` | Inventory SKU code |
| `item_name` | String | `Chicken Breast (Fresh)` | Ingredient name |
| `category` | String | `Meat & Poultry` | Product category |
| `storage_location` | String | `Cold Room 1` | Default storage zone |
| `preferred_supplier` | String | `Metro Foods GmbH` | Assigned primary vendor |
| `supplier_sku` | String | `MF-CHK-8842` | Vendor catalog code |
| `purchase_pack_unit` | String | `Case (10kg)` | Procurement packaging format |
| `pack_size_qty` | Number | `10` | Pack size in inventory units |
| `inventory_unit` | String | `kg` | Stock tracking unit |
| `unit_cost_eur` | Currency | `48.00` | Cost per purchase pack |
| `par_level` | Number | `35.0` | Target operational shelf stock |
| `safety_stock` | Number | `5.0` | Minimum buffer threshold |
| `moq_packs` | Integer | `2` | Minimum order quantity in packs |
| `lead_time_days` | Integer | `2` | Vendor delivery turnaround in days |
| `review_cycle_days` | Integer | `3` | Days between scheduled orders |
| `avg_daily_usage` | Number | `4.5` | Historical consumption per day |
| `current_on_hand` | Number | `8.2` | Current verified physical stock |
| `event_reserved_qty` | Number | `12.0` | Stock committed for upcoming events |
| `poq_suggested_order_qty` | Number | `30` | **Suggested Reorder Quantity** |
| `est_order_total_eur` | Currency | `144.00` | Projected purchase expenditure |
| `order_notes` | String | `Includes banquet reservation buffer` | Par configuration notes |

---

## 💡 Frontend Architecture & Service Mapping

In the mobile app, these specifications are implemented directly in:
* **Invoices & Receipts**: [`src/app/invoices/`](../src/app/invoices/) backed by [`invoiceService.ts`](../src/services/invoiceService.ts).
* **Loss & Cancellations**: [`src/app/loss-logs/`](../src/app/loss-logs/) backed by [`lossService.ts`](../src/services/lossService.ts).
* **Recipes & BOM Depletion**: [`src/app/recipes/`](../src/app/recipes/) backed by [`recipeService.ts`](../src/services/recipeService.ts).
* **Receiving Dock Slips**: [`src/app/delivery-notes/`](../src/app/delivery-notes/) backed by [`deliveryNoteService.ts`](../src/services/deliveryNoteService.ts).
* **Master Inventory**: [`src/app/(tabs)/inventory.tsx`](../src/app/(tabs)/inventory.tsx) backed by [`inventoryService.ts`](../src/services/inventoryService.ts).
