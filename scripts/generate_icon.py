"""
VIS-03: Generate PupPal brand icon (1024x1024)
Coral (#FF6B5C) background with navy (#1B2333) paw print
"""
from PIL import Image, ImageDraw

SIZE = 1024
CORAL = (255, 107, 92)
NAVY = (27, 35, 51)

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Rounded background
RADIUS = 220
draw.rounded_rectangle([0, 0, SIZE, SIZE], radius=RADIUS, fill=CORAL)

# Paw print centered — scale factor
S = SIZE / 100  # 1 unit = ~10.24px

def oval(cx, cy, rx, ry, fill):
    draw.ellipse(
        [int((cx - rx) * S), int((cy - ry) * S),
         int((cx + rx) * S), int((cy + ry) * S)],
        fill=fill,
    )

# Main pad (large oval)
oval(50, 62, 20, 18, NAVY)

# Three toe beans on top
oval(28, 38, 9, 10, NAVY)
oval(50, 30, 9, 10, NAVY)
oval(72, 38, 9, 10, NAVY)

# Small side toes (optional, makes it more realistic)
oval(20, 52, 7, 8, NAVY)
oval(80, 52, 7, 8, NAVY)

out_path = "assets/icon.png"
img.save(out_path, "PNG")
print(f"Saved {out_path} ({SIZE}x{SIZE})")
