from PIL import Image

src = r"C:/Users/moham/.gemini/antigravity/brain/9ef94f07-7162-4733-8ae9-9a51207e0439/.user_uploaded/media_1793719159116_de7885fa.png"
img = Image.open(src).convert("RGBA")
w, h = img.size

# Flood fill or transparent outside
# Background is blue (r < 200, g > 200, b > 230)
# Let's flood fill from (0,0) to find all background pixels
bg_mask = Image.new("L", (w, h), 0)

# BFS flood fill from edges
visited = set()
queue = []
for x in range(w):
    queue.append((x, 0))
    queue.append((x, h - 1))
for y in range(h):
    queue.append((0, y))
    queue.append((w - 1, y))

for pt in queue:
    visited.add(pt)

idx = 0
while idx < len(queue):
    cx, cy = queue[idx]
    idx += 1
    r, g, b, a = img.getpixel((cx, cy))
    
    # Check if this pixel is the blueish background
    # Blue background has high b and g, moderate r (e.g. r < 210, b > 220)
    # The bubble boundary is black (r < 50, g < 50, b < 50)
    is_bg = (b > 200 and g > 180 and r < 210) or (b > 180 and r < 180)
    if is_bg:
        bg_mask.putpixel((cx, cy), 255)
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                visited.add((nx, ny))
                queue.append((nx, ny))

# Now create transparent bubble image
transparent_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
for y in range(h):
    for x in range(w):
        if bg_mask.getpixel((x, y)) == 255:
            transparent_img.putpixel((x, y), (0, 0, 0, 0))
        else:
            transparent_img.putpixel((x, y), img.getpixel((x, y)))

transparent_img.save(r"public/comic-speech-bubble.png", "PNG")
print("Saved transparent comic-speech-bubble.png", transparent_img.size)
