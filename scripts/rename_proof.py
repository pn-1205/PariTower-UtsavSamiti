import os
import re

files_to_update = [
    r"d:\PariTower-UtsavSamiti\src\app\deposits\page.tsx",
    r"d:\PariTower-UtsavSamiti\src\app\expenses\page.tsx",
    r"d:\PariTower-UtsavSamiti\src\app\donations\page.tsx",
    r"d:\PariTower-UtsavSamiti\src\app\transactions\page.tsx",
    r"d:\PariTower-UtsavSamiti\src\app\flats\[id]\page.tsx"
]

for p in files_to_update:
    if not os.path.exists(p):
        continue
    with open(p, "r", encoding="utf-8") as f:
        content = f.read()

    # Table headers
    content = re.sub(r'<th className="px-5 py-3\.5">(Proof|Receipt|Photo)</th>', '<th className="px-5 py-3.5">Attachment</th>', content)

    # Mobile and table buttons
    content = re.sub(r'>\s*Proof\s*<', '>View Attachment<', content)
    content = re.sub(r'>\s*View Proof\s*<', '>View Attachment<', content)
    content = re.sub(r'>\s*View Photo\s*<', '>View Attachment<', content)
    content = re.sub(r'>\s*Receipt\s*<', '>View Attachment<', content)
    content = re.sub(r'>\s*Bill\s*<', '>View Attachment<', content)
    content = re.sub(r'>\s*Photo\s*<', '>View Attachment<', content)
    content = re.sub(r'(<Paperclip[^>]*/>)\s*(Proof|View|Receipt|Bill|Photo|View Proof|View Photo)', r'\1 View Attachment', content)

    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {p}")