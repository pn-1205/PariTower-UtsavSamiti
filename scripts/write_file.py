import sys
import os

def write(filepath, content):
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Wrote {filepath} successfully ({len(content)} bytes)')

if __name__ == '__main__':
    if len(sys.argv) >= 3:
        filepath = sys.argv[1]
        with open(sys.argv[2], 'r', encoding='utf-8') as f:
            content = f.read()
        write(filepath, content)