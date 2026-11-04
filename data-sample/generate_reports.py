import csv
import json
import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

CORE_FILES = [
    {
        "csv": "sample_supplier_delivery_invoice.csv",
        "sheet": "1_Supplier_Invoices_Skip",
        "title": "StockPulse — Inbound Supplier Delivery Invoices & Skip Debt Deduction",
        "header_fill": "1F4E79",  # Navy
        "sum_cols": [10, 11, 15, 16, 18],  # invoiced_qty, received_qty, gross_line_total_eur, skip_deduction_amount_eur, net_payable_debt_eur
        "currency_cols": [13, 15, 16, 18],
    },
    {
        "csv": "sample_pos_order_form_receipt.csv",
        "sheet": "2_POS_Receipts_BOM",
        "title": "StockPulse — POS Sales Receipts & Recipe BOM Ingredient Depletion",
        "header_fill": "2E75B6",  # Steel Blue
        "sum_cols": [9, 11, 16],  # portion_qty_sold, gross_sales_eur, total_ingredient_deducted
        "currency_cols": [10, 11, 19],
    },
    {
        "csv": "sample_kitchen_waste_spoilage.csv",
        "sheet": "3_Food_Loss_Spoilage",
        "title": "StockPulse — Kitchen Food Spoilage, Drops & Prep Trim Loss Logs",
        "header_fill": "C00000",  # Crimson Red
        "sum_cols": [7, 11],  # wasted_quantity, total_loss_cost_eur
        "currency_cols": [10, 11],
    },
    {
        "csv": "sample_kitchen_cancellations.csv",
        "sheet": "4_Kitchen_Ticket_Voids",
        "title": "StockPulse — Kitchen Dish Cancellations & Voided Order Waste Control",
        "header_fill": "C55A11",  # Burnt Orange
        "sum_cols": [6, 9],  # portions_cancelled, monetary_loss_cost_eur
        "currency_cols": [9],
    },
    {
        "csv": "sample_goods_delivery_note.csv",
        "sheet": "5_Receiving_Dock_Slips",
        "title": "StockPulse — Receiving Dock Goods Delivery Notes & HACCP Temperature Checks",
        "header_fill": "375623",  # Olive Green
        "sum_cols": [13, 14, 15, 16],  # ordered_qty, delivered_qty, accepted_qty, rejected_qty
        "currency_cols": [],
    },
    {
        "csv": "poq_order_quantity_setup_template.csv",
        "sheet": "6_POQ_Replenishment_Setup",
        "title": "StockPulse — Periodic Order Quantity (POQ) Par Replenishment Setup",
        "header_fill": "203764",  # Midnight Blue
        "sum_cols": [11, 12, 17, 18, 19, 20],  # par_level, safety_stock, current_on_hand, event_reserved_qty, poq_suggested_order_qty, est_order_total_eur
        "currency_cols": [10, 20],
    },
]

def parse_val(val_str):
    if val_str is None or val_str == "":
        return ""
    val_str = str(val_str).strip()
    if val_str.lower() == "true":
        return True
    if val_str.lower() == "false":
        return False
    # Check numeric
    try:
        if "." in val_str:
            return float(val_str)
        else:
            return int(val_str)
    except ValueError:
        return val_str

def build_excel_workbook():
    wb = openpyxl.Workbook()
    # Remove default sheet
    default_sheet = wb.active
    wb.remove(default_sheet)

    thin_border = Border(
        left=Side(style='thin', color='E0E0E0'),
        right=Side(style='thin', color='E0E0E0'),
        top=Side(style='thin', color='E0E0E0'),
        bottom=Side(style='thin', color='E0E0E0')
    )
    double_bottom_border = Border(
        left=Side(style='thin', color='E0E0E0'),
        right=Side(style='thin', color='E0E0E0'),
        top=Side(style='thin', color='A0AEC0'),
        bottom=Side(style='double', color='1A202C')
    )

    combined_json = {
        "metadata": {
            "application": "StockPulse Mobile F&B Platform",
            "version": "2.4.0",
            "specification": "Frontline Kitchen Operations & Skip Control",
            "currency": "EUR",
            "export_date": "2026-10-07T12:55:00Z",
            "target_roles": ["Storekeeper", "Head Chef", "Store Manager", "Shift Supervisor"],
        },
        "kpi_summary": {
            "supplier_delivery_invoices": {
                "gross_invoiced_total_eur": 734.51,
                "skip_control_deductions_eur": 29.80,
                "net_debt_payable_eur": 704.71,
                "settled_debt_eur": 492.79,
                "outstanding_debt_eur": 211.92,
            },
            "pos_sales_recipe_bom": {
                "gross_sales_revenue_eur": 137.00,
                "portions_sold": 7,
                "ingredients_depleted_count": 13,
                "inventory_sync_status": "100% Synchronized",
            },
            "kitchen_waste_loss": {
                "spoilage_and_drops_loss_eur": 21.79,
                "spoilage_and_drops_qty_kg_l": 5.95,
                "ticket_voids_discarded_waste_eur": 15.74,
                "ticket_voids_saved_revenue_eur": 36.00,
                "total_operational_loss_eur": 37.53,
            },
            "dock_receiving_haccp": {
                "inbound_deliveries_processed": 4,
                "haccp_temperature_compliance_pct": 100.0,
                "packages_accepted_pct": 98.9,
                "dock_rejected_qty": 1.5,
            },
            "poq_par_replenishment": {
                "monitored_core_skus": 10,
                "total_suggested_reorder_units": 233.0,
                "projected_order_commitment_eur": 1003.40,
            }
        },
        "datasets": {}
    }

    # ----------------------------------------------------
    # SHEET 1: Executive KPI Dashboard Sheet
    # ----------------------------------------------------
    ws_kpi = wb.create_sheet(title="0_Executive_KPI_Summary")
    ws_kpi.views.sheetView[0].showGridLines = True

    # Title Banner
    ws_kpi.merge_cells("A1:G1")
    t_cell = ws_kpi.cell(row=1, column=1)
    t_cell.value = "StockPulse — Executive Kitchen Operations & Financial Debt KPI Dashboard"
    t_cell.font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    t_cell.fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    t_cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws_kpi.row_dimensions[1].height = 36

    # Subtitle Row 2
    ws_kpi.merge_cells("A2:G2")
    sub_cell = ws_kpi.cell(row=2, column=1)
    sub_cell.value = "Current Operational Specification: Dockside Skip Deductions, POS Recipe BOM Depletion & Waste Control"
    sub_cell.font = Font(name="Calibri", size=10, italic=True, color="4A5568")
    sub_cell.fill = PatternFill(start_color="EDF2F7", end_color="EDF2F7", fill_type="solid")
    sub_cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws_kpi.row_dimensions[2].height = 22

    # KPI Summary Cards Block
    kpi_cards = [
        ("Gross Invoiced", "€734.51", "Supplier deliveries across 4 invoices", "1F4E79"),
        ("Skip Debt Deducted", "€29.80", "Immediate deduction for damaged/short items", "C55A11"),
        ("Net Payable Debt", "€704.71", "Actual supplier liability after skip control", "2E75B6"),
        ("POS Sales Revenue", "€137.00", "BOM explosion synchronized to raw inventory", "375623"),
        ("Kitchen Loss (Drops/Spoil)", "€21.79", "5.95 kg/L discarded across line stations", "C00000"),
        ("Kitchen Voids Discarded", "€15.74", "3 plates cooked then guest cancelled", "833C0C"),
        ("POQ Reorder Commitment", "€1,003.40", "10 items suggested to hit par stock", "203764"),
    ]

    ws_kpi.cell(row=4, column=1, value="Core Operational Metric").font = Font(name="Calibri", size=11, bold=True, color="1A202C")
    ws_kpi.cell(row=4, column=2, value="Metric Value").font = Font(name="Calibri", size=11, bold=True, color="1A202C")
    ws_kpi.cell(row=4, column=3, value="Operational Meaning & Inventory Impact").font = Font(name="Calibri", size=11, bold=True, color="1A202C")
    ws_kpi.cell(row=4, column=4, value="Primary Staff Role").font = Font(name="Calibri", size=11, bold=True, color="1A202C")
    ws_kpi.cell(row=4, column=5, value="Target Mobile Action").font = Font(name="Calibri", size=11, bold=True, color="1A202C")
    ws_kpi.row_dimensions[4].height = 24

    for c in range(1, 6):
        ws_kpi.cell(row=4, column=c).fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
        ws_kpi.cell(row=4, column=c).border = thin_border

    dashboard_rows = [
        ("1. Supplier Delivery Debt", "€734.51", "Gross billed value before dock inspection", "Storekeeper / Chef", "Verify delivery note & temperature"),
        ("2. Skip Shortage Deductions", "€29.80", "Direct debt write-off for damaged salmon & leaking milk", "Storekeeper / Chef", "Tap '+ Deduct Skip' on invoice"),
        ("3. Net Supplier Debt Payable", "€704.71", "Net approved payable balance (€492.79 settled, €211.92 pending)", "Store Manager", "Tap 'Record Payment (€Net)'"),
        ("4. POS Shift Sales Revenue", "€137.00", "Explodes recipe BOMs to deplete meat, produce, oil & cheese", "Cashier / FOH", "Register closure & automatic stock sync"),
        ("5. Raw Food Loss & Spoilage", "€21.79", "5.95 kg/L dropped or expired raw ingredients", "Chef / Line Cook", "Tap 'Loss & Cancellations' -> Deduct Stock"),
        ("6. Kitchen Dish Voids (Wasted)", "€15.74", "Cooked plates discarded after customer departure", "Chef / Floor Lead", "Log void with 'Prepped & Discarded' status"),
        ("7. Kitchen Dish Voids (Saved)", "€36.00", "Cancelled orders caught BEFORE firing (Zero stock loss)", "Server / Expediter", "Log void with 'Saved Void' (€0.00 cost)"),
        ("8. HACCP Cold-Chain Compliance", "100.0%", "All refrigerated shipments probed compliant (<+4°C)", "Storekeeper", "Log probe temp into dock note"),
        ("9. POQ Replenishment Value", "€1,003.40", "Automated reorder suggestion for 10 core inventory SKUs", "Store Manager", "Review POQ par sheet & approve Purchase Order"),
    ]

    for idx, (label, val, desc, role, action) in enumerate(dashboard_rows, 5):
        ws_kpi.row_dimensions[idx].height = 22
        ws_kpi.cell(row=idx, column=1, value=label).font = Font(name="Calibri", size=10, bold=True, color="2D3748")
        ws_kpi.cell(row=idx, column=2, value=val).font = Font(name="Calibri", size=10, bold=True, color="1F4E79")
        ws_kpi.cell(row=idx, column=3, value=desc).font = Font(name="Calibri", size=10, color="4A5568")
        ws_kpi.cell(row=idx, column=4, value=role).font = Font(name="Calibri", size=10, bold=True, color="2B6CB0")
        ws_kpi.cell(row=idx, column=5, value=action).font = Font(name="Calibri", size=10, italic=True, color="2D3748")

        for c in range(1, 6):
            ws_kpi.cell(row=idx, column=c).border = thin_border
            ws_kpi.cell(row=idx, column=c).fill = PatternFill(start_color="FAFBFC" if idx % 2 == 0 else "FFFFFF", end_color="FAFBFC" if idx % 2 == 0 else "FFFFFF", fill_type="solid")

    ws_kpi.column_dimensions["A"].width = 30
    ws_kpi.column_dimensions["B"].width = 16
    ws_kpi.column_dimensions["C"].width = 58
    ws_kpi.column_dimensions["D"].width = 24
    ws_kpi.column_dimensions["E"].width = 46

    # ----------------------------------------------------
    # SHEETS 2-9: Detail Ledger Sheets from CSV Files
    # ----------------------------------------------------
    for item in CORE_FILES:
        csv_path = os.path.join(DATA_DIR, item["csv"])
        if not os.path.exists(csv_path):
            print(f"Skipping missing: {item['csv']}")
            continue

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = list(csv.reader(f))

        if not reader:
            continue

        headers = reader[0]
        data_rows = reader[1:]

        # Add to JSON bundle
        dict_records = []
        for row in data_rows:
            record = {}
            for idx, h in enumerate(headers):
                raw = row[idx] if idx < len(row) else ""
                record[h] = parse_val(raw)
            dict_records.append(record)
        combined_json["datasets"][item["sheet"]] = dict_records

        # Create Worksheet
        ws = wb.create_sheet(title=item["sheet"])
        ws.views.sheetView[0].showGridLines = True

        # Title Block Row 1
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(headers))
        title_cell = ws.cell(row=1, column=1)
        title_cell.value = item["title"]
        title_cell.font = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
        title_cell.fill = PatternFill(start_color=item["header_fill"], end_color=item["header_fill"], fill_type="solid")
        title_cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        ws.row_dimensions[1].height = 32

        # Header Row Row 2
        ws.row_dimensions[2].height = 24
        header_fill = PatternFill(start_color="F2F4F7", end_color="F2F4F7", fill_type="solid")
        header_font = Font(name="Calibri", size=10, bold=True, color="1A202C")

        for col_idx, col_name in enumerate(headers, 1):
            cell = ws.cell(row=2, column=col_idx)
            cell.value = col_name.replace("_", " ").upper()
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = thin_border

        # Data Rows Row 3+
        for r_idx, row in enumerate(data_rows, 3):
            ws.row_dimensions[r_idx].height = 20
            row_fill_color = "FAFBFC" if r_idx % 2 == 0 else "FFFFFF"
            row_fill = PatternFill(start_color=row_fill_color, end_color=row_fill_color, fill_type="solid")

            for c_idx, val in enumerate(row, 1):
                cell = ws.cell(row=r_idx, column=c_idx)
                
                # Check if numeric
                parsed = parse_val(val)
                if isinstance(parsed, float):
                    cell.value = parsed
                    if c_idx in item.get("currency_cols", []):
                        cell.number_format = "€#,##0.00"
                    elif "pct" in headers[c_idx - 1] or "rate" in headers[c_idx - 1]:
                        cell.number_format = "0.0"
                    else:
                        cell.number_format = "#,##0.00"
                elif isinstance(parsed, int):
                    cell.value = parsed
                    cell.number_format = "#,##0"
                elif isinstance(parsed, bool):
                    cell.value = "TRUE" if parsed else "FALSE"
                else:
                    cell.value = parsed

                cell.fill = row_fill
                cell.font = Font(name="Calibri", size=10, color="2D3748")
                cell.border = thin_border

                # Alignment
                if isinstance(parsed, (int, float)):
                    cell.alignment = Alignment(horizontal="right", vertical="center")
                elif any(dt in headers[c_idx - 1] for dt in ["date", "time", "status", "sku", "code", "ref", "bay", "temp"]):
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                else:
                    cell.alignment = Alignment(horizontal="left", vertical="center")

        # Summary / Totals Row at the bottom
        last_data_row = len(data_rows) + 2
        summary_row = last_data_row + 1
        ws.row_dimensions[summary_row].height = 24

        total_label_cell = ws.cell(row=summary_row, column=1, value="TOTALS / SUMMARY")
        total_label_cell.font = Font(name="Calibri", size=10, bold=True, color="1A202C")
        total_label_cell.alignment = Alignment(horizontal="left", vertical="center")
        total_label_cell.border = double_bottom_border
        total_label_cell.fill = PatternFill(start_color="EDF2F7", end_color="EDF2F7", fill_type="solid")

        for c_idx in range(2, len(headers) + 1):
            sum_cell = ws.cell(row=summary_row, column=c_idx)
            sum_cell.border = double_bottom_border
            sum_cell.fill = PatternFill(start_color="EDF2F7", end_color="EDF2F7", fill_type="solid")

            if c_idx in item.get("sum_cols", []):
                col_let = get_column_letter(c_idx)
                sum_cell.value = f"=SUM({col_let}3:{col_let}{last_data_row})"
                sum_cell.font = Font(name="Calibri", size=10, bold=True, color="1A202C")
                sum_cell.alignment = Alignment(horizontal="right", vertical="center")
                if c_idx in item.get("currency_cols", []):
                    sum_cell.number_format = "€#,##0.00"
                else:
                    sum_cell.number_format = "#,##0.00"

        # Auto-adjust column widths
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                if cell.row in [1, summary_row]:
                    continue
                val_str = str(cell.value or "")
                if len(val_str) > max_len:
                    max_len = len(val_str)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    # Save Excel Workbook
    xlsx_path = os.path.join(DATA_DIR, "StockPulse_F&B_Sample_Reports.xlsx")
    wb.save(xlsx_path)
    file_size_kb = os.path.getsize(xlsx_path) / 1024
    print(f"Excel workbook created successfully: {xlsx_path} ({file_size_kb:.1f} KB)")

    # Save Combined JSON
    json_path = os.path.join(DATA_DIR, "sample_reports_bundle.json")
    with open(json_path, mode="w", encoding="utf-8") as f:
        json.dump(combined_json, f, indent=2, ensure_ascii=False)
    json_size_kb = os.path.getsize(json_path) / 1024
    print(f"JSON bundle created successfully: {json_path} ({json_size_kb:.1f} KB)")

if __name__ == "__main__":
    build_excel_workbook()
