import os
import re

replacements = {
    '"Fit For Loading"': '"FIT_READY"',
    '"Fit"': '"FIT_READY"',
    '"Cut Off"': '"REPAIR_IN_PROGRESS"',
    '"Sick Line"': '"SICK_LINE"',
    '"Sick"': '"SICK_LINE"',
    '"Issue Marked"': '"SICK_LINE"',
    '"Under Inspection"': '"INSPECTION_PENDING"',
    '"Under Repair"': '"REPAIR_IN_PROGRESS"',
    '"Awaiting Testing"': '"FIT_CERTIFICATE_PENDING"',
    '"Awaiting Final Inspection"': '"FIT_CERTIFICATE_PENDING"',
}

def process_file(filepath):
    if not filepath.endswith('.ts') and not filepath.endswith('.tsx'): return
    if 'index.ts' in filepath and 'types' in filepath: return # skip types
    
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        process_file(os.path.join(root, file))
