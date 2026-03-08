"""
Create placeholder Buddy PNG assets for PupPal app.
Simple dog face illustrations using Pillow. 400x400 for quality.
"""

import math
import os
from PIL import Image, ImageDraw

# Brand colors
CORAL = (255, 107, 92)
NAVY = (26, 46, 74)
CREAM = (255, 250, 247)
GOLD = (255, 181, 71)
GREEN = (92, 184, 130)

# Dog palette
DOG_FACE = (222, 185, 143)
DOG_DARK = (175, 135, 95)
DOG_NOSE = (80, 55, 40)
DOG_EYE = (55, 35, 25)
EYE_SHINE = (255, 255, 255)

# 400x400 canvas, all coords at 2x scale
S = 400
CX, CY = 200, 215  # face center
FR = 140            # face radius


def new_canvas(bg):
    img = Image.new("RGBA", (S, S), bg + (255,))
    draw = ImageDraw.Draw(img)
    return img, draw


# ─── Building blocks ──────────────────────────────────────────────────────────

def ears(draw, flop=False):
    ew, eh = 58, flop and 88 or 76
    # left ear
    draw.ellipse([CX - FR - 20, CY - FR + 20, CX - FR + 40, CY - FR + 20 + eh],
                 fill=DOG_DARK)
    # right ear
    draw.ellipse([CX + FR - 40, CY - FR + 20, CX + FR + 20, CY - FR + 20 + eh],
                 fill=DOG_DARK)


def face(draw):
    draw.ellipse([CX - FR, CY - FR, CX + FR, CY + FR],
                 fill=DOG_FACE, outline=DOG_DARK, width=3)


def snout(draw):
    sw, sh = 80, 52
    draw.ellipse([CX - sw, CY + 32, CX + sw, CY + 32 + sh],
                 fill=(240, 205, 165))


def nose(draw):
    draw.ellipse([CX - 24, CY + 36, CX + 24, CY + 52], fill=DOG_NOSE)
    draw.ellipse([CX - 10, CY + 39, CX - 2, CY + 47], fill=(120, 85, 65))


def eyes(draw, wide=False, sleepy=False, looking_up=False, raised_y=False):
    er = 16 if wide else 14
    ey = CY - 30 if not raised_y else CY - 44
    if looking_up:
        ey = CY - 44
    exl, exr = CX - 44, CX + 44

    for ex in [exl, exr]:
        if sleepy:
            draw.ellipse([ex - er, ey - er, ex + er, ey + er], fill=DOG_EYE)
            draw.rectangle([ex - er - 2, ey - er - 2, ex + er + 2, ey + 1], fill=DOG_FACE)
        else:
            draw.ellipse([ex - er, ey - er, ex + er, ey + er], fill=DOG_EYE)
            draw.ellipse([ex + 4, ey - er + 4, ex + er - 2, ey - 4], fill=EYE_SHINE)


def brows(draw, raised=False, furrowed=False):
    ey = CY - 52 if raised else CY - 46
    bw = 28
    exl, exr = CX - 44, CX + 44
    if furrowed:
        draw.line([(exl - bw, ey + 8), (exl + bw, ey - 4)], fill=DOG_DARK, width=5)
        draw.line([(exr - bw, ey - 4), (exr + bw, ey + 8)], fill=DOG_DARK, width=5)
    elif raised:
        draw.arc([exl - bw, ey - 6, exl + bw, ey + 6], 200, 340, fill=DOG_DARK, width=5)
        draw.arc([exr - bw, ey - 6, exr + bw, ey + 6], 200, 340, fill=DOG_DARK, width=5)
    else:
        draw.line([(exl - bw, ey), (exl + bw, ey)], fill=DOG_DARK, width=4)
        draw.line([(exr - bw, ey), (exr + bw, ey)], fill=DOG_DARK, width=4)


def cheeks(draw):
    draw.ellipse([CX - 100, CY + 10, CX - 60, CY + 38], fill=(255, 160, 140, 100))
    draw.ellipse([CX + 60,  CY + 10, CX + 100, CY + 38], fill=(255, 160, 140, 100))


def smile(draw, big=False):
    mw = 44 if big else 32
    mh = 24 if big else 16
    pts = [(CX - mw + (2 * mw) * i / 20,
            CY + 72 + mh * math.sin(math.pi * i / 20))
           for i in range(21)]
    draw.line(pts, fill=DOG_NOSE, width=5)


def neutral_mouth(draw):
    mw = 24
    pts = [(CX - mw + (2 * mw) * i / 10,
            CY + 68 + 8 * math.sin(math.pi * i / 10))
           for i in range(11)]
    draw.line(pts, fill=DOG_NOSE, width=4)


def worried_mouth(draw):
    mw = 28
    pts = [(CX - mw + (2 * mw) * i / 14,
            CY + 76 - 10 * math.sin(math.pi * i / 14))
           for i in range(15)]
    draw.line(pts, fill=DOG_NOSE, width=5)


def sleeping_mouth(draw):
    draw.ellipse([CX - 16, CY + 64, CX + 16, CY + 80], fill=DOG_NOSE)
    draw.ellipse([CX - 12, CY + 66, CX + 12, CY + 77], fill=(200, 150, 120))


def zzz(draw):
    positions = [(CX + 90, CY - 80), (CX + 112, CY - 110), (CX + 128, CY - 136)]
    sizes_list = [22, 18, 14]
    for (px, py), sz in zip(positions, sizes_list):
        draw.line([(px, py), (px + sz, py)], fill=(200, 220, 255), width=3)
        draw.line([(px + sz, py), (px, py + sz)], fill=(200, 220, 255), width=3)
        draw.line([(px, py + sz), (px + sz, py + sz)], fill=(200, 220, 255), width=3)


def sparkles(draw):
    for sx, sy in [(CX - 120, CY - 100), (CX + 130, CY - 80),
                   (CX + 100, CY + 40), (CX - 110, CY + 30)]:
        r = 10
        draw.line([(sx - r, sy), (sx + r, sy)], fill=GOLD, width=3)
        draw.line([(sx, sy - r), (sx, sy + r)], fill=GOLD, width=3)
        draw.line([(sx - r + 4, sy - r + 4), (sx + r - 4, sy + r - 4)], fill=GOLD, width=2)
        draw.line([(sx + r - 4, sy - r + 4), (sx - r + 4, sy + r - 4)], fill=GOLD, width=2)


def thought_bubbles(draw):
    for (bx, by, br) in [(CX + 110, CY - 120, 7),
                         (CX + 124, CY - 142, 10),
                         (CX + 140, CY - 164, 16)]:
        draw.ellipse([bx - br, by - br, bx + br, by + br], fill=CREAM)


def hat(draw):
    pts = [(CX, CY - FR - 4),
           (CX - 40, CY - FR + 40),
           (CX + 40, CY - FR + 40)]
    draw.polygon(pts, fill=CORAL)
    draw.ellipse([CX - 10, CY - FR - 20, CX + 10, CY - FR], fill=GOLD)


def wave_paw(draw):
    px, py = CX + 124, CY + 40
    draw.ellipse([px - 28, py - 36, px + 28, py + 36],
                 fill=DOG_FACE, outline=DOG_DARK, width=3)
    for ox in [-16, -4, 8]:
        draw.ellipse([px + ox - 8, py - 50, px + ox + 8, py - 30], fill=DOG_DARK)


# ─── Expressions ──────────────────────────────────────────────────────────────

def make_buddy(expression: str, bg_color: tuple, output_path: str):
    img, draw = new_canvas(bg_color)

    if expression == "happy":
        ears(draw); face(draw); snout(draw); brows(draw)
        eyes(draw); nose(draw); smile(draw); cheeks(draw)

    elif expression == "thinking":
        ears(draw); face(draw); snout(draw); brows(draw, raised=True)
        eyes(draw, looking_up=True); nose(draw); neutral_mouth(draw)
        thought_bubbles(draw)

    elif expression == "excited":
        ears(draw); face(draw); snout(draw); brows(draw, raised=True)
        eyes(draw, wide=True); nose(draw); smile(draw, big=True)
        cheeks(draw); sparkles(draw)

    elif expression == "teaching":
        ears(draw); face(draw); snout(draw); brows(draw)
        eyes(draw); nose(draw); neutral_mouth(draw)
        # Book icon
        bx, by = CX + 116, CY + 56
        draw.rectangle([bx - 20, by - 24, bx + 20, by + 24],
                       fill=(100, 150, 220), outline=NAVY, width=2)
        draw.line([(bx, by - 24), (bx, by + 24)], fill=NAVY, width=2)

    elif expression == "celebrating":
        ears(draw); face(draw); snout(draw); brows(draw, raised=True)
        eyes(draw, wide=True); nose(draw); smile(draw, big=True)
        cheeks(draw); sparkles(draw); hat(draw)

    elif expression == "concerned":
        ears(draw, flop=True); face(draw); snout(draw); brows(draw, furrowed=True)
        eyes(draw); nose(draw); worried_mouth(draw)

    elif expression == "sleeping":
        ears(draw, flop=True); face(draw); snout(draw)
        eyes(draw, sleepy=True); nose(draw); sleeping_mouth(draw); zzz(draw)

    elif expression == "greeting":
        ears(draw); face(draw); snout(draw); brows(draw, raised=True)
        eyes(draw, wide=True); nose(draw); smile(draw, big=True)
        cheeks(draw); wave_paw(draw)

    final = img.convert("RGB")
    final.save(output_path, "PNG", compress_level=3)
    size_kb = os.path.getsize(output_path) / 1024
    print(f"  ✓ {os.path.basename(output_path)}: {size_kb:.1f} KB")


def main():
    out_dir = "/work/repos/wt-five-fixes/assets/buddy"
    os.makedirs(out_dir, exist_ok=True)

    specs = [
        ("happy",       CORAL,             "buddy-happy.png"),
        ("thinking",    (255, 235, 220),   "buddy-thinking.png"),
        ("excited",     (255, 240, 200),   "buddy-excited.png"),
        ("teaching",    (220, 235, 250),   "buddy-teaching.png"),
        ("celebrating", GOLD,              "buddy-celebrating.png"),
        ("concerned",   (228, 228, 233),   "buddy-concerned.png"),
        ("sleeping",    NAVY,              "buddy-sleeping.png"),
        ("greeting",    CORAL,             "buddy-greeting.png"),
    ]

    print("Creating Buddy PNG assets (400×400)...")
    for expression, bg, filename in specs:
        make_buddy(expression, bg, f"{out_dir}/{filename}")

    print("\nAll assets created!")


if __name__ == "__main__":
    main()
