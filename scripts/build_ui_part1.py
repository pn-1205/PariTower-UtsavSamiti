# Build UI Part 1
import os

def write(p, content):
    os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f'Wrote {p}')

