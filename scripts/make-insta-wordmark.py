"""Instagram-Profilbild: nur der Schriftzug CURBSIDE im schwarzen Kreis.

Schrift wie auf der Website (system-ui = SF Pro auf dem Mac), Black Italic,
eng gesetzt (tracking-tighter = -0.05em).

Aufruf:  python3 scripts/make-insta-wordmark.py
Braucht: pip install pillow   (läuft nur auf macOS, wegen SF Pro)
Ausgabe: exports/instagram/profilbild/curbside-text*.png
"""
import os

from PIL import Image, ImageDraw, ImageFont

S = 1080
SS = 4                      # Supersampling für saubere Kanten
INK = (9, 9, 11)
WHITE = (250, 250, 250)
FONT = "/System/Library/Fonts/SFNSItalic.ttf"
TRACK = -0.05               # em
OUT = os.path.join(os.path.dirname(__file__), "..", "exports", "instagram", "profilbild")
os.makedirs(OUT, exist_ok=True)


def font(size):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_name("Black Italic")
    return f


def line_width(text, f, size):
    return f.getlength(text) + TRACK * size * (len(text) - 1)


def draw_line(d, text, f, size, cx, baseline, fill=WHITE):
    x = cx - line_width(text, f, size) / 2
    for ch in text:
        d.text((x, baseline), ch, font=f, fill=fill, anchor="ls")
        x += f.getlength(ch) + TRACK * size


def ink_box(lines, size):
    """Tatsächliche Ausdehnung des Schriftzugs, um ihn optisch zu zentrieren."""
    W = S * SS
    img = Image.new("L", (W, W), 0)
    d = ImageDraw.Draw(img)
    f = font(size)
    lead = size * 0.86
    for i, t in enumerate(lines):
        draw_line(d, t, f, size, W / 2, W / 2 + i * lead, fill=255)
    return img.getbbox()


def render(lines, size, name):
    W = S * SS
    size *= SS
    box = ink_box(lines, size)
    dx = W / 2 - (box[0] + box[2]) / 2
    dy = W / 2 - (box[1] + box[3]) / 2
    img = Image.new("RGB", (W, W), INK)
    d = ImageDraw.Draw(img)
    f = font(size)
    lead = size * 0.86
    for i, t in enumerate(lines):
        draw_line(d, t, f, size, W / 2 + dx, W / 2 + dy + i * lead)
    img = img.resize((S, S), Image.LANCZOS)
    path = os.path.join(OUT, name)
    img.save(path)

    # Vorschau: rund zugeschnitten, plus 150 px und 44 px
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, S, S), fill=255)
    rnd = Image.new("RGB", (S, S), "white")
    rnd.paste(img, mask=mask)
    prev = Image.new("RGB", (S + 400, S), "white")
    prev.paste(rnd, (0, 0))
    prev.paste(rnd.resize((150, 150), Image.LANCZOS), (S + 125, 300))
    prev.paste(rnd.resize((44, 44), Image.LANCZOS), (S + 178, 600))
    prev.save(path.replace(".png", "-vorschau.png"))


render(["CURB", "SIDE"], 330, "curbside-text.png")
render(["CURBSIDE"], 190, "curbside-text-einzeilig.png")
print(os.path.abspath(OUT))
