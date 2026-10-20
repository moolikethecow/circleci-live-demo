// One-off generator for brand/qr-live-demo.png (macOS, no dependencies).
//   swift scripts/make-qr.swift "https://circleci-live-demo.vercel.app" brand/qr-live-demo.png
// Dark modules on white, with a 4-module quiet zone, as the QR spec requires.
import AppKit
import CoreImage
import CoreImage.CIFilterBuiltins

let args = CommandLine.arguments
guard args.count == 3 else {
    FileHandle.standardError.write(Data("usage: make-qr.swift <url> <out.png>\n".utf8))
    exit(1)
}
let filter = CIFilter.qrCodeGenerator()
filter.message = Data(args[1].utf8)
filter.correctionLevel = "M"
guard let qr = filter.outputImage else { exit(1) }

let modules = Int(qr.extent.width)  // one pixel per module
let scale = 12  // pixels per module in the final PNG
let quiet = 4  // modules of white border
let size = (modules + 2 * quiet) * scale

let ctx = CIContext()
let scaled = qr.transformed(by: CGAffineTransform(scaleX: CGFloat(scale), y: CGFloat(scale)))
guard let cg = ctx.createCGImage(scaled, from: scaled.extent, format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB()) else { exit(1) }

let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8,
    samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
    bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
let gc = NSGraphicsContext(bitmapImageRep: rep)!
NSGraphicsContext.current = gc
gc.cgContext.interpolationQuality = .none
gc.cgContext.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
gc.cgContext.fill(CGRect(x: 0, y: 0, width: size, height: size))
gc.cgContext.draw(cg, in: CGRect(x: quiet * scale, y: quiet * scale, width: modules * scale, height: modules * scale))
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
print("wrote \(args[2]): \(modules)x\(modules) modules, \(size)x\(size) px")
