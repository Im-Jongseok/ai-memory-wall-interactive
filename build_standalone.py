"""Bundle the exact static presentation into an offline, single HTML file."""
import base64
import json
from pathlib import Path

root = Path(__file__).resolve().parent
dist = root / 'dist'
assets = {}
for path in sorted((dist / 'assets').glob('*.webp')):
    assets[path.name] = 'data:image/webp;base64,' + base64.b64encode(path.read_bytes()).decode()

html = (dist / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (dist / 'style.css').read_text() + '</style>')
for name, value in assets.items():
    html = html.replace('src="assets/' + name + '"', 'src="' + value + '"')
pdf = 'data:application/pdf;base64,' + base64.b64encode((dist / 'assets/AI-and-Memory-Wall-IEEE.pdf').read_bytes()).decode()
html = html.replace('href="assets/AI-and-Memory-Wall-IEEE.pdf" target="_blank"', 'href="' + pdf + '" download="AI-and-Memory-Wall-IEEE.pdf"')
scripts = 'window.REVIEW_ASSETS=' + json.dumps(assets) + ';\n' + (dist / 'content.js').read_text() + '\n' + (dist / 'app.js').read_text()
html = html.replace('<script src="content.js"></script><script src="app.js"></script>', '<script>' + scripts + '</script>')
output = root.parent / 'AI_and_Memory_Wall_인터랙티브.html'
output.write_text(html)
print(output)
