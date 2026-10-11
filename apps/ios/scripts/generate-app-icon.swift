#!/usr/bin/env swift
import AppKit
import Foundation

let pixels = 1024
let size = CGFloat(pixels)
guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: pixels,
    pixelsHigh: pixels,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
) else {
    fputs("bitmap failed\n", stderr)
    exit(1)
}
rep.size = NSSize(width: size, height: size)

NSGraphicsContext.saveGraphicsState()
guard let context = NSGraphicsContext(bitmapImageRep: rep) else {
    fputs("graphics context failed\n", stderr)
    exit(1)
}
NSGraphicsContext.current = context
let cg = context.cgContext
cg.translateBy(x: 0, y: size)
cg.scaleBy(x: 1, y: -1)

NSColor(srgbRed: 20 / 255, green: 43 / 255, blue: 74 / 255, alpha: 1).setFill()
NSBezierPath(rect: NSRect(x: 0, y: 0, width: size, height: size)).fill()

func strokePath(_ path: NSBezierPath, color: NSColor, width: CGFloat) {
    color.setStroke()
    path.lineWidth = width
    path.lineCapStyle = .round
    path.lineJoinStyle = .round
    path.stroke()
}

let scale = size / 48
let paper = NSBezierPath(roundedRect: NSRect(x: 11 * scale, y: 12.5 * scale, width: 20.5 * scale, height: 23.5 * scale), xRadius: 3 * scale, yRadius: 3 * scale)
strokePath(paper, color: NSColor(srgbRed: 244 / 255, green: 247 / 255, blue: 249 / 255, alpha: 1), width: 2.4 * scale)

let clip = NSBezierPath()
clip.move(to: NSPoint(x: 18 * scale, y: 12.5 * scale))
clip.line(to: NSPoint(x: 18 * scale, y: 11.3 * scale))
clip.curve(to: NSPoint(x: 20.2 * scale, y: 9.1 * scale), controlPoint1: NSPoint(x: 18 * scale, y: 10.1 * scale), controlPoint2: NSPoint(x: 19 * scale, y: 9.1 * scale))
clip.line(to: NSPoint(x: 27.8 * scale, y: 9.1 * scale))
clip.curve(to: NSPoint(x: 30 * scale, y: 11.3 * scale), controlPoint1: NSPoint(x: 29 * scale, y: 9.1 * scale), controlPoint2: NSPoint(x: 30 * scale, y: 10.1 * scale))
clip.line(to: NSPoint(x: 30 * scale, y: 12.5 * scale))
strokePath(clip, color: NSColor(srgbRed: 244 / 255, green: 247 / 255, blue: 249 / 255, alpha: 1), width: 2.4 * scale)

let badgeCenter = NSPoint(x: 32.5 * scale, y: 32.5 * scale)
let badgeFill = NSBezierPath(ovalIn: NSRect(x: badgeCenter.x - 8.2 * scale, y: badgeCenter.y - 8.2 * scale, width: 16.4 * scale, height: 16.4 * scale))
NSColor(srgbRed: 20 / 255, green: 43 / 255, blue: 74 / 255, alpha: 1).setFill()
badgeFill.fill()
strokePath(badgeFill, color: NSColor(srgbRed: 22 / 255, green: 166 / 255, blue: 161 / 255, alpha: 1), width: 2.4 * scale)

let check = NSBezierPath()
check.move(to: NSPoint(x: 29.4 * scale, y: 32.6 * scale))
check.line(to: NSPoint(x: 31.6 * scale, y: 34.8 * scale))
check.line(to: NSPoint(x: 35.8 * scale, y: 29.8 * scale))
strokePath(check, color: NSColor(srgbRed: 22 / 255, green: 166 / 255, blue: 161 / 255, alpha: 1), width: 2.4 * scale)

NSGraphicsContext.restoreGraphicsState()

guard let png = rep.representation(using: .png, properties: [:]) else {
    fputs("icon export failed\n", stderr)
    exit(1)
}

let out = CommandLine.arguments.dropFirst().first ?? "AppIcon.png"
try png.write(to: URL(fileURLWithPath: out))
print("wrote \(out)")
