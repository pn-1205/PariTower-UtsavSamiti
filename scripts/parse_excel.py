import openpyxl
import json
import os

excel_path = r"D:\PariTower-UtsavSamiti\Pari_Election_Data.xlsx"
wb = openpyxl.load_workbook(excel_path)
sheet = wb.active

residents = []
refugee_flats = {"8-18", "8-19", "13-18", "13-19"}

for row in list(sheet.iter_rows(values_only=True))[1:]:
    sr, floor, flat_raw, owner_name, owner_phone = row[:5]
    if floor is None or flat_raw is None:
        continue
    
    floor_num = int(floor)
    raw_str = str(flat_raw).strip()
    
    # Calculate flat number suffix
    # e.g. 101 -> floor 1, flat 1 -> '1-01'
    # e.g. 1419 -> floor 14, flat 19 -> '14-19'
    # e.g. 1005 -> floor 10, flat 5 -> '10-05'
    if floor_num >= 10:
        suffix = int(raw_str[2:])
    else:
        suffix = int(raw_str[1:])
        
    display_name = f"{floor_num}-{suffix:02d}"
    is_refugee = display_name in refugee_flats
    
    clean_name = str(owner_name).replace('\r', '').strip() if owner_name else None
    clean_phone = str(owner_phone).replace('\r', '').strip() if owner_phone else None
    
    if is_refugee:
        clean_name = "Refugee Area"
        clean_phone = None

    residents.append({
        "floor": floor_num,
        "flatNumber": suffix,
        "displayName": display_name,
        "altName": raw_str,
        "ownerName": clean_name,
        "ownerPhone": clean_phone,
        "isRefugee": is_refugee
    })

regular_count = sum(1 for r in residents if not r["isRefugee"])
refugee_count = sum(1 for r in residents if r["isRefugee"])
print(f"Total parsed: {len(residents)}, Regular: {regular_count}, Refugee: {refugee_count}")

out_path = r"D:\PariTower-UtsavSamiti\prisma\residents.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(residents, f, indent=2, ensure_ascii=False)

print(f"Saved to {out_path}")
