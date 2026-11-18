"""Erzeugt einen runden QR-Code-Sticker (SVG, PDF, PNG) im Curbside-Badge-Stil.

Aufruf:  python3 scripts/make-qr-sticker.py [URL]
Braucht: pip install "qrcode[pil]" cairosvg
Ausgabe: exports/sticker/
"""
import math
import os
import sys

import cairosvg
import qrcode
from PIL import ImageFont

URL = sys.argv[1] if len(sys.argv) > 1 else "https://curbside.sortelba.com/"
LABEL = "curbside.sortelba.com"

D = 75.0          # Sticker-Durchmesser in mm (Schnittkante)
BLEED = 2.0       # Beschnitt rundum in mm
R = D / 2
R_WHITE = 26.0    # weißer Innenkreis
QR_SIDE = 34.0    # QR-Code-Kantenlänge (inkl. 1 Modul Rand)
INK = "#09090b"
FONT = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

OUT = os.path.join(os.path.dirname(__file__), "..", "exports", "sticker")
os.makedirs(OUT, exist_ok=True)

_pil = ImageFont.truetype(FONT, 1000)


def glyph_w(ch, size, spacing):
    return _pil.getlength(ch) / 1000 * size + spacing


def arc_text(text, radius, size, spacing, top=True, center_deg=None):
    """Setzt Text Buchstabe für Buchstabe auf einen Kreisbogen (ohne textPath)."""
    widths = [glyph_w(c, size, spacing) for c in text]
    total = sum(widths) - spacing
    span = total / radius  # rad
    c = R + BLEED
    parts = []
    if top:
        ang = -math.pi / 2 - span / 2   # Start links oben, im Uhrzeigersinn
        for ch, w in zip(text, widths):
            a = ang + (w - spacing) / 2 / radius
            x, y = c + radius * math.cos(a), c + radius * math.sin(a)
            rot = math.degrees(a) + 90
            parts.append(f'<text x="0" y="0" transform="translate({x:.3f} {y:.3f}) rotate({rot:.3f})" '
                         f'text-anchor="middle" font-size="{size}">{esc(ch)}</text>')
            ang += w / radius
    else:
        ang = math.pi / 2 + span / 2    # Start links unten, gegen Uhrzeigersinn
        for ch, w in zip(text, widths):
            a = ang - (w - spacing) / 2 / radius
            x, y = c + radius * math.cos(a), c + radius * math.sin(a)
            rot = math.degrees(a) - 90
            parts.append(f'<text x="0" y="0" transform="translate({x:.3f} {y:.3f}) rotate({rot:.3f})" '
                         f'text-anchor="middle" font-size="{size}">{esc(ch)}</text>')
            ang -= w / radius
    return "\n".join(parts)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def qr_paths():
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=1)
    qr.add_data(URL)
    qr.make(fit=True)
    m = qr.get_matrix()
    n = len(m)
    cell = QR_SIDE / n
    x0 = y0 = R + BLEED - QR_SIDE / 2
    d = []
    for yy, row in enumerate(m):
        for xx, on in enumerate(row):
            if on:
                d.append(f"M{x0 + xx * cell:.4f},{y0 + yy * cell:.4f}h{cell:.4f}v{cell:.4f}h-{cell:.4f}z")
    return "".join(d), qr.version


def build(with_guides):
    W = D + 2 * BLEED
    c = R + BLEED
    qr_d, ver = qr_paths()
    # Ring-Text liegt mittig zwischen weißem Innenkreis und Schnittkante
    ring_mid = (R_WHITE + R - 1.2) / 2
    top = arc_text("CURBSIDE", ring_mid - 1.9, 7.2, 0.55, top=True)
    bottom = arc_text("SCAN · SKATE · READ", ring_mid + 1.2, 3.3, 0.45, top=False)
    url = arc_text(LABEL, R_WHITE - 3.3, 2.2, 0.12, top=False)
    dot_r = 0.9
    dots = "".join(
        f'<circle cx="{c + ring_mid * math.cos(math.radians(a)):.3f}" '
        f'cy="{c + ring_mid * math.sin(math.radians(a)):.3f}" r="{dot_r}" fill="#fff"/>'
        for a in (180 - 8, 8)
    )
    guides = ""
    if with_guides:
        guides = (f'<circle cx="{c}" cy="{c}" r="{R}" fill="none" stroke="#ff00ff" stroke-width="0.15" stroke-dasharray="1 0.6"/>'
                  f'<circle cx="{c}" cy="{c}" r="{R - 2}" fill="none" stroke="#00b7ff" stroke-width="0.1" stroke-dasharray="0.5 0.5"/>')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{W}mm" viewBox="0 0 {W} {W}">
<title>Curbside QR-Sticker – {esc(URL)}</title>
<rect width="{W}" height="{W}" fill="{'#ffffff' if with_guides else 'none'}"/>
<circle cx="{c}" cy="{c}" r="{R + BLEED}" fill="{INK}"/>
<circle cx="{c}" cy="{c}" r="{R_WHITE}" fill="#ffffff"/>
<g fill="#ffffff" font-family="Arial Black" font-weight="900" font-style="italic">
{top}
{bottom}
</g>
{dots}
<path d="{qr_d}" fill="{INK}"/>
<g fill="{INK}" font-family="Arial Black" font-weight="900">
{url}
</g>
{guides}
</svg>'''
    return svg, ver


svg, ver = build(False)
svg_guides, _ = build(True)
with open(os.path.join(OUT, "curbside-qr-sticker.svg"), "w") as f:
    f.write(svg)
with open(os.path.join(OUT, "curbside-qr-sticker-vorschau.svg"), "w") as f:
    f.write(svg_guides)
cairosvg.svg2pdf(bytestring=svg.encode(), write_to=os.path.join(OUT, "curbside-qr-sticker.pdf"))
px = round((D + 2 * BLEED) / 25.4 * 600)
cairosvg.svg2png(bytestring=svg.encode(), write_to=os.path.join(OUT, "curbside-qr-sticker-600dpi.png"),
                 output_width=px, output_height=px)
cairosvg.svg2png(bytestring=svg_guides.encode(), write_to=os.path.join(OUT, "curbside-qr-sticker-vorschau.png"),
                 output_width=900, output_height=900)
print(f"QR-Version {ver}, URL {URL} -> {os.path.abspath(OUT)}")
