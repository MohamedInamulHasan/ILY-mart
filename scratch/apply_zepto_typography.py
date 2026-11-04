# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

font_links = """  <!-- Zepto-Style Modern Typography: Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&display=swap" rel="stylesheet">
"""

if 'Plus+Jakarta+Sans' not in html:
    html = html.replace('<title>', font_links + '\n  <title>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('[OK] index.html updated with Plus Jakarta Sans!')
else:
    print('[SKIP] index.html already has Plus Jakarta Sans')

# 2. Update tailwind.config.js
tailwind_config = """/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
"""
with open('tailwind.config.js', 'w', encoding='utf-8') as f:
    f.write(tailwind_config)
print('[OK] tailwind.config.js updated!')

# 3. Update src/index.css
with open('src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

font_import = "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&display=swap');\n"

if 'Plus+Jakarta+Sans' not in css:
    css = font_import + css

# Global typographic styles for Zepto text style
root_font_rules = """
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  letter-spacing: -0.015em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body, html, #root {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  letter-spacing: -0.015em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  letter-spacing: -0.022em;
}

p, span, a, label, button, input, textarea, select {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
"""

# Replace existing :root block
import re
css = re.sub(r':root\s*\{[^}]*\}', root_font_rules.strip(), css)

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('[OK] src/index.css updated!')
print('[DONE] Zepto typography applied!')
