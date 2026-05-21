import os

replacements = {
    'SENTI<span className="text-gradient-cyan-violet">MAP</span>': 'SENTI<span className="text-gradient-cyan-violet">MAP</span>',
    'SENTIMAP': 'SENTIMAP',
    'Sentimap': 'Sentimap',
    'sentimap': 'sentimap'
}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements.items():
            new_content = new_content.replace(old, new)
            
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {filepath}')
    except Exception as e:
        pass

for root, dirs, files in os.walk('c:/Users/Lenovo/Desktop/HECATON'):
    if 'node_modules' in root or '.git' in root or '__pycache__' in root or 'dist' in root or '.gemini' in root:
        continue
    for file in files:
        if file.endswith(('.jsx', '.js', '.css', '.html', '.md', '.py', '.json', '.env', '.env.example')):
            replace_in_file(os.path.join(root, file))
print('Done!')
