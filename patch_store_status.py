import re

with open('src/store/useAppStore.ts', 'r') as f:
    content = f.read()

# Replace literal string statuses in updateWagon triggers and logic
replacements = {
    '"Fit For Loading"': '"FIT_READY"',
    '"Fit"': '"FIT_READY"',
    '"Cut Off"': '"REPAIR_IN_PROGRESS"',
    '"Sick Line"': '"SICK_LINE"',
    '"Issue Marked"': '"SICK_LINE"',
    '"Under Inspection"': '"INSPECTION_PENDING"',
    '"Under Repair"': '"REPAIR_IN_PROGRESS"',
    '"Awaiting Testing"': '"FIT_CERTIFICATE_PENDING"',
    '"Awaiting Final Inspection"': '"FIT_CERTIFICATE_PENDING"',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Completely rip out fixWorkflowConsistency
# It's no longer needed if we standardize status and rely on auto-repair
content = re.sub(r'fixWorkflowConsistency: \(\) => \{.*?(?=addEmployee:)', '', content, flags=re.DOTALL)

with open('src/store/useAppStore.ts', 'w') as f:
    f.write(content)
