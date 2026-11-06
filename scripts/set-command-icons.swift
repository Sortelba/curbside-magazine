// Zeichnet für jede .command-Datei ein eigenes Icon und setzt es im Finder.
// Aufruf (im Projektordner):  swift scripts/set-command-icons.swift [png-ausgabeordner]
// Hinweis: Finder-Icons werden nicht von Git gespeichert – nach einem frischen
// Clone einfach erneut ausführen.
import AppKit

struct IconSpec {
    let file: String
    let symbol: String
    let top: NSColor
    let bottom: NSColor
}

let specs: [IconSpec] = [
    IconSpec(file: "Start Admin.command", symbol: "play.fill",
             top: NSColor(red: 0.20, green: 0.85, blue: 0.45, alpha: 1),
             bottom: NSColor(red: 0.05, green: 0.55, blue: 0.30, alpha: 1)),
    IconSpec(file: "Stop Admin.command", symbol: "stop.fill",
             top: NSColor(red: 1.00, green: 0.40, blue: 0.35, alpha: 1),
             bottom: NSColor(red: 0.75, green: 0.10, blue: 0.15, alpha: 1)),
    IconSpec(file: "Autoscan.command", symbol: "dot.radiowaves.left.and.right",
             top: NSColor(red: 0.55, green: 0.45, blue: 1.00, alpha: 1),
             bottom: NSColor(red: 0.30, green: 0.15, blue: 0.75, alpha: 1)),
    IconSpec(file: "Publish.command", symbol: "paperplane.fill",
             top: NSColor(red: 0.30, green: 0.70, blue: 1.00, alpha: 1),
             bottom: NSColor(red: 0.05, green: 0.35, blue: 0.80, alpha: 1)),
]

func makeIcon(_ spec: IconSpec, size: CGFloat = 1024) -> NSImage {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()

    // macOS-typische abgerundete Kachel mit etwas Rand
    let inset = size * 0.09
    let rect = NSRect(x: inset, y: inset, width: size - 2 * inset, height: size - 2 * inset)
    let tile = NSBezierPath(roundedRect: rect, xRadius: size * 0.2, yRadius: size * 0.2)

    NSGraphicsContext.saveGraphicsState()
    let shadow = NSShadow()
    shadow.shadowColor = NSColor.black.withAlphaComponent(0.35)
    shadow.shadowOffset = NSSize(width: 0, height: -size * 0.012)
    shadow.shadowBlurRadius = size * 0.03
    shadow.set()
    spec.bottom.setFill()
    tile.fill()
    NSGraphicsContext.restoreGraphicsState()

    NSGradient(starting: spec.top, ending: spec.bottom)?.draw(in: tile, angle: -90)

    // Kleines "CURBSIDE"-Label unten
    let label = "CURBSIDE" as NSString
    let labelAttrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: size * 0.075, weight: .black),
        .foregroundColor: NSColor.white.withAlphaComponent(0.85),
        .kern: size * 0.006,
    ]
    let labelSize = label.size(withAttributes: labelAttrs)
    label.draw(at: NSPoint(x: (size - labelSize.width) / 2, y: rect.minY + size * 0.08),
               withAttributes: labelAttrs)

    // SF Symbol in der Mitte
    let config = NSImage.SymbolConfiguration(pointSize: size * 0.36, weight: .bold)
        .applying(NSImage.SymbolConfiguration(paletteColors: [.white]))
    if let symbol = NSImage(systemSymbolName: spec.symbol, accessibilityDescription: nil)?
        .withSymbolConfiguration(config) {
        let s = symbol.size
        let origin = NSPoint(x: (size - s.width) / 2, y: (size - s.height) / 2 + size * 0.05)
        symbol.draw(in: NSRect(origin: origin, size: s))
    }

    image.unlockFocus()
    return image
}

let cwd = FileManager.default.currentDirectoryPath
let pngDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : nil
var failed = false

for spec in specs {
    let path = (cwd as NSString).appendingPathComponent(spec.file)
    guard FileManager.default.fileExists(atPath: path) else {
        print("übersprungen (nicht gefunden): \(spec.file)")
        continue
    }
    let icon = makeIcon(spec)
    if NSWorkspace.shared.setIcon(icon, forFile: path, options: []) {
        print("Icon gesetzt: \(spec.file)")
    } else {
        print("FEHLER beim Setzen: \(spec.file)")
        failed = true
    }
    if let dir = pngDir,
       let tiff = icon.tiffRepresentation,
       let png = NSBitmapImageRep(data: tiff)?.representation(using: .png, properties: [:]) {
        let name = spec.file.replacingOccurrences(of: ".command", with: ".png")
        try? png.write(to: URL(fileURLWithPath: dir).appendingPathComponent(name))
    }
}

exit(failed ? 1 : 0)
