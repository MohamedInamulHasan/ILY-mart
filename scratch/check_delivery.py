with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
print("Length of DeliveryDashboard:", len(text))
# Check if there is an order detail view or modal in DeliveryDashboard
for match in re.finditer(r'(modal|detail|ordercard|items|customer|address)', text, re.I):
    start = max(0, match.start() - 40)
    end = min(len(text), match.end() + 60)
    # print sample
    line_num = text[:match.start()].count('\n') + 1
    # print first 15 occurrences
    # print(f"L{line_num}: {text[start:end].replace(chr(10), ' ')}")

# Search for navigation to order details or modal component
for line_i, line in enumerate(text.split('\n')):
    if any(k in line.lower() for k in ['orderdetail', 'selectedorder', 'feedmodal', 'view details', 'order_details']):
        print(f"L{line_i+1}: {line.strip()}")

