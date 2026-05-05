import json
import os
import re

# Load english translations
with open(r"c:\Users\omarn\OneDrive\Desktop\Health Tracker\vitalsense-frontend\src\i18n\locales\en.json", "r", encoding="utf-8") as f:
    en_data = json.load(f)

# Build replacement map: string -> t('namespace.key')
replacements = {}
for ns, keys in en_data.items():
    for key, val in keys.items():
        replacements[val] = f"t('{ns}.{key}')"

directories = [
    r"c:\Users\omarn\OneDrive\Desktop\Health Tracker\vitalsense-frontend\src\pages",
    r"c:\Users\omarn\OneDrive\Desktop\Health Tracker\vitalsense-frontend\src\components"
]

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content
    
    # Simple replacement for >Text<
    for text, t_val in replacements.items():
        # Replace >Text< with >{t('key')}<
        content = re.sub(rf'>\s*{re.escape(text)}\s*<', f'>{{{t_val}}}<', content)
        
        # Replace placeholder="Text" with placeholder={t('key')}
        content = re.sub(rf'placeholder="{re.escape(text)}"', f'placeholder={{{t_val}}}', content)
        content = re.sub(rf"placeholder='{re.escape(text)}'", f"placeholder={{{t_val}}}", content)
        
        # Replace "Text" or 'Text' if it's standalone in JSX (often inside tags but matched above)
        # We can also match title="Text" etc if needed
        content = re.sub(rf'title="{re.escape(text)}"', f'title={{{t_val}}}', content)
        
    if content != original_content:
        # Check if useTranslation is imported
        if 'useTranslation' not in content:
            # Add import after last import
            imports_end = [m.end() for m in re.finditer(r'^import .*$', content, re.MULTILINE)]
            if imports_end:
                last_import_idx = imports_end[-1]
                content = content[:last_import_idx] + "\nimport { useTranslation } from 'react-i18next'" + content[last_import_idx:]
            else:
                content = "import { useTranslation } from 'react-i18next'\n" + content
        
        # Add const { t } = useTranslation() inside the component
        # Find the first component definition: const ComponentName = (...) => { or function ComponentName(...) {
        comp_match = re.search(r'(?:const|let|var)\s+\w+\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>\s*{', content)
        if not comp_match:
            comp_match = re.search(r'function\s+\w+\s*\([^)]*\)\s*{', content)
        
        if comp_match:
            if 'const { t } = useTranslation()' not in content:
                idx = comp_match.end()
                content = content[:idx] + "\n  const { t } = useTranslation();" + content[idx:]
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    for filename in os.listdir(d):
        if filename.endswith(".jsx") or filename.endswith(".js"):
            process_file(os.path.join(d, filename))

print("Done")
