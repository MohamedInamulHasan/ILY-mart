from PIL import Image
import numpy as np

img = Image.open(r"public/comic-speech-bubble.png")
w, h = img.size
alpha = np.array(img.split()[-1])

# Find mask of the bubble
mask = alpha > 50

# Find contour using marching squares / Moore-Neighbor tracing
# Start at first point
start = None
for y in range(h):
    for x in range(w):
        if mask[y, x]:
            start = (x, y)
            break
    if start:
        break

# Trace boundary
directions = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]
contour = []
curr = start
d = 0

while True:
    contour.append(curr)
    found = False
    for i in range(8):
        nd = (d + i) % 8
        dx, dy = directions[nd]
        nx, ny = curr[0] + dx, curr[1] + dy
        if 0 <= nx < w and 0 <= ny < h and mask[ny, nx]:
            curr = (nx, ny)
            d = (nd + 6) % 8  # Turn back 90 deg
            found = True
            break
    if not found or (curr == start and len(contour) > 20):
        break
    if len(contour) > 20000:
        break

print(f"Traced contour with {len(contour)} points")

# Subsample contour for clean SVG path
step = max(1, len(contour) // 180)
pts = contour[::step]

# Write SVG
svg_path = f"M {pts[0][0]} {pts[0][1]} "
for p in pts[1:]:
    svg_path += f"L {p[0]} {p[1]} "
svg_path += "Z"

svg_code = f'''<svg viewBox="0 0 {w} {h}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="{svg_path}" fill="white" stroke="#111827" stroke-width="4" stroke-linejoin="round" />
</svg>'''

with open(r"public/comic-bubble.svg", "w", encoding="utf-8") as f:
    f.write(svg_code)

print("Saved public/comic-bubble.svg with viewBox 0 0", w, h)
