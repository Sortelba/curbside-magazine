"""Erzeugt Instagram-Profilbilder (1080×1080) im Curbside-Stil.

Aufruf:  python3 scripts/make-insta-logo.py
Braucht: pip install cairosvg pillow
Ausgabe: exports/instagram/profilbild/
  - curbside-profilbild.png          Variante „CURB/SIDE“ (Schrift)
  - curbside-profilbild-badge.png    Variante Badge mit Board auf der Curb
  - *-vorschau.png                   so sieht es rund zugeschnitten und klein aus
"""
import os

import cairosvg
from PIL import Image, ImageDraw, ImageFont

S = 1080
INK = "#09090b"
FONT = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
OUT = os.path.join(os.path.dirname(__file__), "..", "exports", "instagram", "profilbild")
os.makedirs(OUT, exist_ok=True)
_pil = ImageFont.truetype(FONT, 1000)


def width(text, size, spacing=0):
    return _pil.getlength(text) / 1000 * size + spacing * (len(text) - 1)


def board(cx, cy, scale, fill):
    """Board im 50-50 auf schräger Curb, aus dem Badge (Original-Mitte 64,64)."""
    return f'''<g transform="translate({cx} {cy}) scale({scale}) translate(-64 -64)" fill="{fill}">
  <polygon points="42,71 92,71 86,88 36,88"/>
  <g transform="rotate(-1.5 64 64)">
    <path d="M33,60 Q29,60 27.5,55 L31,54.3 Q32,57 35,57 L93,57 Q96,57 97,54.3 L100.5,55 Q99,60 95,60 Z"/>
    <path d="M45,60 h8 l-1.5,3.5 h-5 Z"/>
    <path d="M76,60 h8 l-1.5,3.5 h-5 Z"/>
    <circle cx="49" cy="67" r="4"/>
    <circle cx="80" cy="67" r="4"/>
  </g>
</g>'''


def wordmark():
    size = 235
    lines = ["CURB", "SIDE"]
    skew = -10
    cap = 0.716 * size               # Versalhöhe Arial Black
    gap = 0.12 * size
    block_h = 2 * cap + gap
    top = (S - block_h) / 2 - 85     # etwas nach oben, Platz fürs Board
    parts = []
    for i, t in enumerate(lines):
        base = top + cap + i * (cap + gap)
        w = width(t, size, -8)
        parts.append(f'<text x="{S/2 - w/2:.1f}" y="{base:.1f}" font-size="{size}" letter-spacing="-8">{t}</text>')
    text = f'<g fill="#fafafa" font-family="Arial Black" font-weight="900" transform="translate({S/2} {S/2}) skewX({skew}) translate({-S/2} {-S/2})">{"".join(parts)}</g>'
    by = top + block_h + 100
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">
<rect width="{S}" height="{S}" fill="{INK}"/>
{text}
{board(S/2, by, 4.6, "#fafafa")}
</svg>'''


def badge():
    # Wie public/logo/curbside-badge.svg, aber ohne die winzige Unterzeile,
    # mit dickerem Ring und größerer Schrift, damit es in 110 px noch lesbar ist.
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{S}" height="{S}" viewBox="0 0 120 120">
<defs><path id="top" d="M22.5,60 a37.5,37.5 0 0,1 75,0"/></defs>
<rect width="120" height="120" fill="{INK}"/>
<circle cx="60" cy="60" r="34" fill="#fafafa"/>
<text fill="#fafafa" font-family="Arial Black" font-weight="900" font-size="15" letter-spacing="1.6">
  <textPath href="#top" xlink:href="#top" startOffset="50%" text-anchor="middle">CURBSIDE</textPath>
</text>
{board(60, 64, 0.82, INK)}
<circle cx="17" cy="64" r="2.6" fill="#fafafa"/><circle cx="103" cy="64" r="2.6" fill="#fafafa"/>
</svg>'''


def save(name, svg):
    path = os.path.join(OUT, name)
    with open(path.replace(".png", ".svg"), "w") as f:
        f.write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=path, output_width=S, output_height=S)
    # Vorschau: runder Zuschnitt groß + in Instagram-Größe (150 px und 44 px)
    img = Image.open(path).convert("RGBA")
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, S, S), fill=255)
    round_ = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    round_.paste(img, mask=mask)
    prev = Image.new("RGB", (S + 400, S), "white")
    prev.paste(round_.convert("RGB"), (0, 0))
    prev.paste(round_.resize((150, 150), Image.LANCZOS).convert("RGB"), (S + 125, 300))
    prev.paste(round_.resize((44, 44), Image.LANCZOS).convert("RGB"), (S + 178, 600))
    prev.save(path.replace(".png", "-vorschau.png"))


save("curbside-profilbild.png", wordmark())
save("curbside-profilbild-badge.png", badge())
print(os.path.abspath(OUT))
