#!/usr/bin/env python3
"""
generate_exclusions.py

Automates:
1. Consolidating the CE catalog Excel
2. Extracting CFR entries
3. Filtering and grouping
4. Transforming hierarchy levels (EC, Condition, Header, CE texts)
5. Generating exclusions.json with fields:
   - id
   - structuredID (original CE ID)
   - unit (Department–Agency or Agency)
   - longUnit
   - unitOrder
   - origin ("[longUnit]'s Categorical Exclusions")
   - originUrl
   - context (Header_Text)
   - additionalContext (Condition_Text)
   - circumstances (EC_Text)
   - exclusion (CE_Text)
   - sorted by trailing CE number within each unit
"""

import pandas as pd
import json
from pathlib import Path
from collections import defaultdict

def clean(val):
    """Convert NaN or empty to 'None', else return string."""
    if pd.isna(val) or str(val).strip().lower() in ['', 'nan']:
        return 'None'
    return str(val)

# File paths
DATA_DIR        = Path('/mnt/data')
CE_EXCEL        = DATA_DIR / 'SGM_May-2024-CE-Catalog with color coding for 18F working checkpoint 1 (1).xlsx'
DEPT_EXCEL      = DATA_DIR / 'agency dept names 4.xlsx'

COMBINED_CSV    = DATA_DIR / 'combined_corrected.csv'
CFR_CSV         = DATA_DIR / 'cfr_dataset.csv'
FILTERED_CSV    = DATA_DIR / 'combined_filtered.csv'
GROUPED_CSV     = DATA_DIR / 'combined_grouped_corrected.csv'
TRANSFORMED_CSV = DATA_DIR / 'combined_transformed_final.csv'
JSON_FILE       = DATA_DIR / 'exclusions.json'

# 1) Load mapping with explicit column names
dept_df = pd.read_excel(DEPT_EXCEL)
# Expect columns: 'Agency', 'Department', 'Order', 'Agency or Department Full Title'
agency_col    = 'Agency'
dept_col      = 'Department'
unitorder_col = 'Order'
longunit_col  = 'Agency or Department Full Title'

agency_to_dept      = dict(zip(dept_df[agency_col].astype(str), dept_df[dept_col].astype(str)))
agency_to_unitorder = dict(zip(dept_df[agency_col].astype(str), dept_df[unitorder_col].astype(str)))
agency_to_longunit  = dict(zip(dept_df[agency_col].astype(str), dept_df[longunit_col].astype(str)))

# 2) Consolidate CE catalog sheets
xls      = pd.read_excel(CE_EXCEL, sheet_name=None)
combined = pd.concat(xls.values(), ignore_index=True)
combined.to_csv(COMBINED_CSV, index=False)

# 3) Extract CFR entries
cfr = combined.loc[
    combined['Is_cfr'].astype(str).str.upper() == 'TRUE',
    ['Agency', 'Text']
].rename(columns={'Agency':'Identifier','Text':'Link'})
cfr.to_csv(CFR_CSV, index=False)

# 4) Filter out Ignore==TRUE and group by ID (merging Text)
filtered = combined.loc[combined['Ignore'].astype(str).str.upper() != 'TRUE']
filtered.to_csv(FILTERED_CSV, index=False)
agg = {c:'first' for c in filtered.columns if c!='Text'}
agg['Text'] = lambda texts: '\n'.join(texts.dropna().astype(str))
grouped = filtered.groupby('ID', as_index=False).agg(agg)
grouped.to_csv(GROUPED_CSV, index=False)

# 5) Transform hierarchy (pull EC, Condition, Header texts)
id2text = dict(zip(grouped['ID'], grouped['Text']))
mask = (
    (grouped['Is_EC'].astype(str).str.upper()!='TRUE') &
    (grouped['Is Condition'].astype(str).str.upper()!='TRUE') &
    (grouped['Is Header'].astype(str).str.upper()!='TRUE')
)
ce = grouped.loc[mask].copy()

def parse_parents(id_str):
    parts = id_str.split('-')
    if len(parts)<5:
        return (None,None,None)
    ag, ec, cond, hdr = parts[0], parts[1], parts[2], parts[3]
    return (
        id2text.get(f"{ag}-{ec}---"),
        id2text.get(f"{ag}-{ec}-{cond}--"),
        id2text.get(f"{ag}-{ec}-{cond}-{hdr}-")
    )

parents = ce['ID'].apply(lambda x: pd.Series(parse_parents(x),
    index=['EC_Text','Condition_Text','Header_Text']))
ce = pd.concat([ce, parents], axis=1)
ce['CE_Text'] = ce['Text']
ce.to_csv(TRANSFORMED_CSV, index=False)

# 6) Build and sort exclusions.json
cfr_map = dict(zip(cfr['Identifier'], cfr['Link']))
records_by_unit = defaultdict(list)

for idx, row in ce.iterrows():
    agency = clean(row['Agency'])
    dept   = agency_to_dept.get(agency, 'None')
    longu  = agency_to_longunit.get(agency, 'None')
    uorder = clean(agency_to_unitorder.get(agency, 'None'))
    unit   = agency if agency.strip().lower()==dept.strip().lower() else f"{dept} - {agency}"
    origin = clean(f"{longu}'s Categorical Exclusions")
    rec = {
        'id':                idx+1,
        'structuredID':      clean(row['ID']),
        'unit':              clean(unit),
        'longUnit':          clean(longu),
        'unitOrder':         uorder,
        'origin':            origin,
        'originUrl':         clean(cfr_map.get(agency, None)),
        'context':           clean(row.get('Header_Text')),
        'additionalContext': clean(row.get('Condition_Text')),
        'circumstances':     clean(row.get('EC_Text')),
        'exclusion':         clean(row.get('CE_Text'))
    }
    records_by_unit[unit].append(rec)

# Sort within each unit by the trailing integer in structuredID
sorted_records = []
for unit in sorted(records_by_unit):
    group = records_by_unit[unit]
    def sort_key(r):
        parts = r['structuredID'].rsplit('-',1)
        try:
            return int(parts[-1])
        except:
            return 0
    sorted_records.extend(sorted(group, key=sort_key))

with open(JSON_FILE, 'w') as f:
    json.dump(sorted_records, f, indent=2)

print("Generated files:")
print(f" - {COMBINED_CSV}")
print(f" - {CFR_CSV}")
print(f" - {FILTERED_CSV}")
print(f" - {GROUPED_CSV}")
print(f" - {TRANSFORMED_CSV}")
print(f" - {JSON_FILE}")
