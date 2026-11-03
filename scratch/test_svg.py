svg_code = '''<svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
  <!-- Back note (tilted left) -->
  <g transform="rotate(-8 18 15)">
    <rect x="3" y="5" width="28" height="16" rx="3" fill="#009922" stroke="#FFFFFF" strokeWidth="1.6" />
    <circle cx="17" cy="13" r="3" stroke="#FFFFFF" strokeWidth="1" fill="none" />
    <circle cx="7" cy="13" r="1" fill="#FFFFFF" />
    <circle cx="27" cy="13" r="1" fill="#FFFFFF" />
  </g>
  <!-- Middle note (tilted right) -->
  <g transform="rotate(7 20 16)">
    <rect x="5" y="6" width="28" height="16" rx="3" fill="#00B329" stroke="#FFFFFF" strokeWidth="1.6" />
    <circle cx="19" cy="14" r="3" stroke="#FFFFFF" strokeWidth="1" fill="none" />
    <circle cx="9" cy="14" r="1" fill="#FFFFFF" />
    <circle cx="29" cy="14" r="1" fill="#FFFFFF" />
  </g>
  <!-- Front note (straight/prominent) -->
  <g>
    <rect x="5" y="10" width="30" height="17" rx="3.2" fill="#00B329" stroke="#FFFFFF" strokeWidth="1.8" />
    <circle cx="20" cy="18.5" r="3.4" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
    <circle cx="9.5" cy="18.5" r="1.1" fill="#FFFFFF" />
    <circle cx="30.5" cy="18.5" r="1.1" fill="#FFFFFF" />
    <rect x="7" y="12" width="26" height="13" rx="1.8" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="1.5 1.5" fill="none" opacity="0.8" />
  </g>
</svg>'''
with open('scratch/test_notes.svg', 'w', encoding='utf-8') as f:
    f.write(svg_code)
print("Saved scratch/test_notes.svg")
