import AppKit
import Foundation

enum Mood: String { case idle, working, waiting, alert, sleeping, happy, offline
    var label: String {
        switch self {
        case .idle: return "待命摸鱼"
        case .working: return "努力工作中"
        case .waiting: return "等待下一步"
        case .alert: return "有事需要你"
        case .sleeping: return "休息一下"
        case .happy: return "开心冒泡"
        case .offline: return "服务未连接"
        }
    }
    var frame: Int {
        switch self { case .working, .waiting, .alert: return 1
        case .happy: return 2
        case .sleeping, .offline: return 3
        default: return 0 }
    }
}
struct RuntimeState: Decodable {
    struct Load: Decodable { let running: Int; let queued: Int }
    struct Health: Decodable { let state: String }
    struct Setup: Decodable { struct Problem: Decodable {} ; let problem: Problem? }
    let paused: Bool
    let load: Load
    let health: [String: Health]
    var setup: Setup? = nil
}
func moodFor(_ state: RuntimeState?, sleeping: Bool, online: Bool) -> Mood {
    guard online, let state else { return .offline }
    if state.setup?.problem != nil || state.health.values.contains(where: { $0.state == "error" }) { return .alert }
    if sleeping { return .sleeping }
    if state.paused { return .waiting }
    if state.load.running > 0 { return .working }
    return state.load.queued > 0 ? .waiting : .idle
}
struct PetMetrics {
    let art: CGFloat
    var window: NSSize { NSSize(width: art + 12, height: ceil(art * 1.06) + 32) }
    static func saved(_ value: Double) -> PetMetrics { PetMetrics(art: [72.0, 92.0, 112.0].contains(value) ? value : 92) }
}
struct VisualPose {
    var x: CGFloat = 0; var y: CGFloat = 0; var rotation: CGFloat = 0
    var scaleX: CGFloat = 1; var scaleY: CGFloat = 1
}
func interactionPose(time: Double, hovered: Bool, dragging: Bool, pressed: Bool, lean: CGFloat, landingAge: Double,
                     happy: Bool, reducedMotion: Bool) -> VisualPose {
    if reducedMotion { return VisualPose() }
    var p = VisualPose()
    p.y = sin(time * (happy ? 9 : 2)) * (happy ? 3.5 : 1.3)
    p.rotation = sin(time * 1.4) * 0.7
    if hovered { p.scaleX = 1.045; p.scaleY = 1.045; p.rotation += lean * 0.24; p.x = lean * 0.12 }
    if pressed { p.scaleX = 1.05; p.scaleY = 0.94; p.y += 2 }
    if dragging {
        p.scaleX = 0.94; p.scaleY = 1.07; p.y = -4
        p.rotation = max(-16, min(16, lean)) + sin(time * 8) * 2.5
    } else if landingAge >= 0 && landingAge < 1 {
        let spring = sin(landingAge * 21) * exp(-landingAge * 6)
        p.scaleX += spring * 0.10; p.scaleY -= spring * 0.12; p.y += spring * 3
    }
    return p
}
func clamped(_ origin: NSPoint, to rect: NSRect, size: NSSize = PetMetrics.saved(0).window) -> NSPoint {
    NSPoint(x: max(rect.minX, min(origin.x, rect.maxX - size.width)), y: max(rect.minY, min(origin.y, rect.maxY - size.height)))
}

final class PetPanel: NSPanel {
    override var canBecomeKey: Bool { false }
    override var canBecomeMain: Bool { false }
}

final class PetView: NSView {
    weak var owner: Companion?
    var frames: [NSImage] = []
    var phase: Double = 0
    private var mouseStart = NSPoint.zero
    private var windowStart = NSPoint.zero
    private var moved = false
    private var dragCursor = false
    private var tracking: NSTrackingArea?
    private var hovered = false
    private var pressed = false
    private var dragging = false
    private var targetLean: CGFloat = 0
    private var lean: CGFloat = 0
    private var lastDragX: CGFloat = 0
    private var landedAt = Date.distantPast
    private var pattedAt = Date.distantPast
    var statusText: String {
        if dragging { return "被拎起来啦" }
        if hovered { return owner?.sleeping == true ? "嘘，让我再睡会儿" : "鱼片，你来啦" }
        return owner?.displayMood.label ?? "待命摸鱼"
    }
    override var isFlipped: Bool { true }
    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let tracking { removeTrackingArea(tracking) }
        let area = NSTrackingArea(rect: bounds, options: [.mouseEnteredAndExited, .mouseMoved, .activeAlways, .inVisibleRect], owner: self)
        addTrackingArea(area); tracking = area
    }
    func advance() {
        phase += 1 / 24
        lean += (targetLean - lean) * 0.22
        needsDisplay = true
    }
    private func accessibilityChanged() { setAccessibilityValue(statusText) }
    override func mouseEntered(with event: NSEvent) { hovered = true; accessibilityChanged(); needsDisplay = true }
    override func mouseExited(with event: NSEvent) {
        hovered = false
        if !dragging { targetLean = 0 }
        accessibilityChanged(); needsDisplay = true
    }
    override func mouseMoved(with event: NSEvent) {
        guard !dragging else { return }
        let point = convert(event.locationInWindow, from: nil)
        targetLean = max(-12, min(12, (point.x / max(1, bounds.width) - 0.5) * 24))
    }
    override func accessibilityPerformPress() -> Bool {
        guard let owner else { return false }
        owner.makeMenu().popUp(positioning: nil, at: NSPoint(x: bounds.midX, y: bounds.midY), in: self)
        return true
    }
    override func draw(_ dirtyRect: NSRect) {
        guard let owner else { return }
        let mood = owner.displayMood
        let reduce = NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
        let art = owner.metrics.art
        let pose = interactionPose(time: phase, hovered: hovered, dragging: dragging, pressed: pressed, lean: lean,
            landingAge: Date().timeIntervalSince(landedAt), happy: mood == .happy, reducedMotion: reduce)
        let frameIndex = dragging ? 2 : mood.frame
        if frames.indices.contains(frameIndex) {
            let frame = frames[frameIndex]
            NSGraphicsContext.saveGraphicsState()
            let transform = NSAffineTransform()
            transform.translateX(by: bounds.midX + pose.x, yBy: art * 0.7 + pose.y)
            transform.rotate(byDegrees: pose.rotation)
            transform.scaleX(by: pose.scaleX, yBy: pose.scaleY)
            transform.translateX(by: -bounds.midX, yBy: -art * 0.7)
            transform.concat()
            frame.draw(in: NSRect(x: 6, y: 6, width: art, height: frame.size.height * art / 148), from: .zero,
                operation: .sourceOver, fraction: 1, respectFlipped: true, hints: nil)
            NSGraphicsContext.restoreGraphicsState()
        }
        if hovered && !dragging && mood != .sleeping {
            let sparkle: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 12), .foregroundColor: NSColor.systemTeal.withAlphaComponent(0.8)]
            ("✦" as NSString).draw(at: NSPoint(x: bounds.width - 19, y: 2 + (reduce ? 0 : sin(phase * 3) * 2)), withAttributes: sparkle)
        }
        let patAge = Date().timeIntervalSince(pattedAt)
        if patAge >= 0 && patAge < 1.2 {
            let attrs: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 16), .foregroundColor: NSColor.systemPink.withAlphaComponent(1 - patAge / 1.2)]
            ("♥" as NSString).draw(at: NSPoint(x: bounds.midX - 6, y: 2 + (reduce ? 0 : (1 - patAge / 1.2) * 10)), withAttributes: attrs)
        }
        // Stay visually small while idle; expose status on hover or when attention is needed.
        guard hovered || dragging || mood == .alert || mood == .offline || mood == .working || mood == .happy else { return }
        let text = statusText + (mood == .working && !hovered && !dragging ? " · \(owner.runtime?.load.running ?? 0)" : "")
        let attrs: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 9, weight: .medium),
            .foregroundColor: NSColor(calibratedRed: 0.29, green: 0.37, blue: 0.53, alpha: 1)]
        let size = (text as NSString).size(withAttributes: attrs)
        let rect = NSRect(x: (bounds.width - size.width - 20) / 2, y: bounds.height - 21, width: size.width + 20, height: 18)
        NSColor(calibratedWhite: 0.98, alpha: 0.96).setFill()
        let pill = NSBezierPath(roundedRect: rect, xRadius: 10, yRadius: 10); pill.fill()
        NSColor(calibratedRed: 0.65, green: 0.74, blue: 0.90, alpha: 0.7).setStroke(); pill.lineWidth = 0.5; pill.stroke()
        (mood == .offline || mood == .alert ? NSColor.systemOrange : NSColor.systemTeal).setFill()
        NSBezierPath(ovalIn: NSRect(x: rect.minX + 6, y: rect.minY + 7, width: 4, height: 4)).fill()
        (text as NSString).draw(at: NSPoint(x: rect.minX + 14, y: rect.minY + 3), withAttributes: attrs)
    }
    override func mouseDown(with event: NSEvent) {
        mouseStart = NSEvent.mouseLocation; windowStart = window?.frame.origin ?? .zero; moved = false
        lastDragX = mouseStart.x; pressed = true; needsDisplay = true
    }
    override func mouseDragged(with event: NSEvent) {
        let now = NSEvent.mouseLocation
        if hypot(now.x - mouseStart.x, now.y - mouseStart.y) > 4 { moved = true }
        guard moved else { return }
        if !dragCursor { NSCursor.closedHand.push(); dragCursor = true }
        dragging = true; pressed = false
        targetLean = max(-16, min(16, (now.x - lastDragX) * 0.8)); lastDragX = now.x
        accessibilityChanged()
        window?.setFrameOrigin(NSPoint(x: windowStart.x + now.x - mouseStart.x, y: windowStart.y + now.y - mouseStart.y))
        owner?.bubble.orderOut(nil)
    }
    override func mouseUp(with event: NSEvent) {
        if dragCursor { NSCursor.pop(); dragCursor = false }
        pressed = false; dragging = false; targetLean = 0
        if moved { landedAt = Date(); owner?.keepOnScreen(); owner?.savePosition() }
        else if event.clickCount == 2 { pattedAt = Date(); owner?.feed() }
        else { pattedAt = Date(); owner?.showMenu(event, view: self) }
        accessibilityChanged(); needsDisplay = true
    }
    override func rightMouseDown(with event: NSEvent) { owner?.showMenu(event, view: self) }
    override func resetCursorRects() { addCursorRect(bounds, cursor: .openHand) }
}

final class Companion: NSObject, NSApplicationDelegate {
    let defaults = UserDefaults.standard
    var metrics = PetMetrics.saved(0)
    let panel = PetPanel(contentRect: NSRect(origin: .zero, size: PetMetrics.saved(0).window),
        styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
    let bubble = PetPanel(contentRect: NSRect(x: 0, y: 0, width: 240, height: 64),
        styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
    let view = PetView(frame: NSRect(origin: .zero, size: PetMetrics.saved(0).window))
    var status: NSStatusItem!
    var runtime: RuntimeState?
    var online = false
    var celebratingUntil = Date.distantPast
    var bubbleTimer: Timer?
    var animation: Timer?
    var poll: Timer?
    var inFlight: URLSessionDataTask?
    var serviceStarting = false
    var openAfterStart = false
    var serviceProcess: Process?
    var projectRoot: URL? {
        guard let file = Bundle.main.url(forResource: "project-root", withExtension: "txt"),
              let path = try? String(contentsOf: file, encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines),
              !path.isEmpty else { return nil }
        return URL(fileURLWithPath: path, isDirectory: true)
    }
    var sleeping: Bool { defaults.bool(forKey: "sleeping") }
    var displayMood: Mood {
        let mood = moodFor(runtime, sleeping: sleeping, online: online)
        return Date() < celebratingUntil && (mood == .idle || mood == .working) ? .happy : mood
    }
    lazy var session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.connectionProxyDictionary = [:]
        configuration.timeoutIntervalForRequest = 5
        return URLSession(configuration: configuration)
    }()
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        metrics = PetMetrics.saved(defaults.double(forKey: "artSize"))
        panel.setContentSize(metrics.window); view.frame = NSRect(origin: .zero, size: metrics.window)
        guard let path = Bundle.main.path(forResource: "pet-sprite", ofType: "png"),
              let image = NSImage(contentsOfFile: path), let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
            NSLog("Missing pet sprite"); NSApp.terminate(nil); return
        }
        let cell = cg.width / 2
        for i in 0..<4 {
            let inset = i >= 2 ? 38 : 0
            let height = i >= 2 ? cell - inset : min(cell + 34, cg.height)
            let rect = CGRect(x: (i % 2) * cell, y: (i / 2) * cell + inset, width: cell, height: height)
            guard let crop = cg.cropping(to: rect) else { NSApp.terminate(nil); return }
            view.frames.append(NSImage(cgImage: crop, size: NSSize(width: 148, height: CGFloat(height) * 148 / CGFloat(cell))))
        }
        for window in [panel, bubble] {
            window.isOpaque = false; window.backgroundColor = .clear; window.hasShadow = false
            window.level = .floating; window.hidesOnDeactivate = false
            window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .ignoresCycle]
            window.isReleasedWhenClosed = false
        }
        panel.title = "guang harness · 鲸鱼娘"; panel.contentView = view; view.owner = self
        panel.acceptsMouseMovedEvents = true
        view.setAccessibilityElement(true); view.setAccessibilityRole(.button)
        view.setAccessibilityLabel("guang harness · 鲸鱼娘，拖动换位置，点击打开互动菜单")
        bubble.ignoresMouseEvents = true
        if defaults.object(forKey: "x") != nil {
            panel.setFrameOrigin(NSPoint(x: defaults.double(forKey: "x"), y: defaults.double(forKey: "y")))
        } else { resetPosition() }
        keepOnScreen()
        if !defaults.bool(forKey: "hidden") { panel.orderFrontRegardless() }
        status = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        status.button?.title = "🐳"
        refreshMenu()
        NotificationCenter.default.addObserver(self, selector: #selector(screenChanged), name: NSApplication.didChangeScreenParametersNotification, object: nil)
        animation = Timer.scheduledTimer(withTimeInterval: 1 / 24, repeats: true) { [weak self] _ in
            guard let self, self.panel.isVisible else { return }
            self.view.advance()
        }
        if let animation { RunLoop.main.add(animation, forMode: .common) }
        poll = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in self?.readState() }
        readState()
        if !defaults.bool(forKey: "introduced") {
            say("鲸鱼娘已全局上线！拖动我换位置，点我互动，菜单栏 🐳 可随时找回。")
            defaults.set(true, forKey: "introduced")
        }
        startService(openWhenReady: true)
    }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        keepOnScreen(); panel.orderFrontRegardless(); defaults.set(false, forKey: "hidden")
        startService(openWhenReady: true)
        return true
    }
    func applicationWillTerminate(_ notification: Notification) {
        savePosition(); animation?.invalidate(); poll?.invalidate(); inFlight?.cancel(); session.invalidateAndCancel()
    }
    func menuItem(_ title: String, _ action: Selector, checked: Bool? = nil) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: action, keyEquivalent: ""); item.target = self
        if let checked { item.state = checked ? .on : .off }
        return item
    }
    func makeMenu() -> NSMenu {
        let menu = NSMenu()
        let heading = NSMenuItem(title: "guang harness · 鲸鱼娘 · \(displayMood.label)", action: nil, keyEquivalent: ""); heading.isEnabled = false
        menu.addItem(heading); menu.addItem(.separator())
        menu.addItem(menuItem("🍚 喂白饭", #selector(feed)))
        menu.addItem(menuItem(sleeping ? "☀️ 叫醒" : "🌙 休息（后台任务继续）", #selector(toggleSleep)))
        menu.addItem(menuItem(panel.isVisible ? "隐藏伙伴" : "显示伙伴", #selector(toggleVisibility)))
        menu.addItem(menuItem("始终置顶", #selector(toggleTop), checked: panel.level == .floating))
        let sizes = NSMenuItem(title: "伙伴大小", action: nil, keyEquivalent: "")
        let submenu = NSMenu()
        for (label, value) in [("迷你", 72), ("小巧（默认）", 92), ("舒展", 112)] {
            let item = menuItem(label, #selector(changeSize(_:)), checked: Int(metrics.art) == value)
            item.tag = value; submenu.addItem(item)
        }
        sizes.submenu = submenu; menu.addItem(sizes)
        menu.addItem(menuItem("回到主屏幕右下角", #selector(resetPosition)))
        menu.addItem(.separator())
        menu.addItem(menuItem("打开 guang harness", #selector(openConsole)))
        menu.addItem(menuItem(serviceStarting ? "正在启动 GH…" : "启动 / 检查 GH 服务", #selector(ensureService)))
        menu.addItem(menuItem("形象来源与署名", #selector(credits)))
        menu.addItem(.separator()); menu.addItem(menuItem("退出鲸鱼娘（GH 继续运行）", #selector(quit)))
        return menu
    }
    func refreshMenu() { status?.menu = makeMenu() }
    func showMenu(_ event: NSEvent, view: NSView) { NSMenu.popUpContextMenu(makeMenu(), with: event, for: view) }
    func savePosition() { defaults.set(panel.frame.minX, forKey: "x"); defaults.set(panel.frame.minY, forKey: "y") }
    @objc func screenChanged() { keepOnScreen() }
    func keepOnScreen() {
        let target = NSScreen.screens.max(by: { a, b in
            let aa = a.visibleFrame.intersection(panel.frame), bb = b.visibleFrame.intersection(panel.frame)
            return aa.width * aa.height < bb.width * bb.height
        })
        if let target { panel.setFrameOrigin(clamped(panel.frame.origin, to: target.visibleFrame, size: panel.frame.size)) }
    }
    @objc func changeSize(_ sender: NSMenuItem) {
        let old = panel.frame
        metrics = PetMetrics.saved(Double(sender.tag)); defaults.set(Double(metrics.art), forKey: "artSize")
        panel.setContentSize(metrics.window); view.frame = NSRect(origin: .zero, size: metrics.window)
        panel.setFrameOrigin(NSPoint(x: old.midX - metrics.window.width / 2, y: old.minY))
        keepOnScreen(); savePosition(); refreshMenu(); view.needsDisplay = true
    }
    @objc func resetPosition() {
        if let screen = NSScreen.main ?? NSScreen.screens.first {
            panel.setFrameOrigin(NSPoint(x: screen.visibleFrame.maxX - metrics.window.width - 24, y: screen.visibleFrame.minY + 76)); savePosition()
        }
    }
    @objc func feed() { celebratingUntil = Date().addingTimeInterval(4); say("白饭！最喜欢鱼片啦～ 🍚"); refreshMenu() }
    @objc func toggleSleep() {
        defaults.set(!sleeping, forKey: "sleeping")
        say(sleeping ? "我眯一会儿，GH 后台任务照常运行哦。" : "醒啦，继续陪你工作！")
        refreshMenu(); view.needsDisplay = true
    }
    @objc func toggleVisibility() {
        if panel.isVisible { panel.orderOut(nil); bubble.orderOut(nil) } else { keepOnScreen(); panel.orderFrontRegardless() }
        defaults.set(!panel.isVisible, forKey: "hidden"); refreshMenu()
    }
    @objc func toggleTop() {
        panel.level = panel.level == .floating ? .normal : .floating
        bubble.level = panel.level; refreshMenu()
    }
    @objc func openConsole() { startService(openWhenReady: true) }
    @objc func ensureService() { startService(openWhenReady: false) }
    func startService(openWhenReady: Bool) {
        openAfterStart = openAfterStart || openWhenReady
        guard !serviceStarting else { return }
        guard let root = projectRoot else { say("找不到项目路径，请重新构建 guang harness 应用。"); return }
        let script = root.appendingPathComponent("scripts/local-superagent")
        guard FileManager.default.isExecutableFile(atPath: script.path) else { say("找不到 GH 启动脚本，请检查项目目录。"); return }
        serviceStarting = true; refreshMenu()
        let process = Process()
        process.executableURL = script; process.arguments = ["start"]
        process.currentDirectoryURL = root
        var env = ProcessInfo.processInfo.environment
        env["PATH"] = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".local/bin").path
            + ":/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        process.environment = env
        let logURL = root.appendingPathComponent(".artifacts/desktop-launch.log")
        if !FileManager.default.fileExists(atPath: logURL.path) {
            FileManager.default.createFile(atPath: logURL.path, contents: nil, attributes: [.posixPermissions: 0o600])
        }
        guard let output = try? FileHandle(forWritingTo: logURL) else {
            serviceStarting = false; say("无法写入启动日志，请检查项目目录权限。"); refreshMenu(); return
        }
        output.seekToEndOfFile(); process.standardOutput = output; process.standardError = output
        process.terminationHandler = { [weak self] process in
            try? output.close()
            DispatchQueue.main.async {
                guard let self else { return }
                self.serviceStarting = false; self.serviceProcess = nil; self.refreshMenu()
                let shouldOpen = self.openAfterStart; self.openAfterStart = false
                self.readState()
                if [0, 2, 3].contains(process.terminationStatus) {
                    if shouldOpen { NSWorkspace.shared.open(self.consoleURL(root: root)) }
                } else { self.say("GH 启动未完成，请查看 desktop-launch.log。菜单里可以重试。") }
            }
        }
        serviceProcess = process
        do { try process.run() }
        catch {
            try? output.close(); serviceProcess = nil; serviceStarting = false; openAfterStart = false
            refreshMenu(); say("无法启动 GH，请查看应用旁的项目目录。")
        }
    }
    func consoleURL(root: URL) -> URL {
        // Use the authenticated startup URL locally; never display or log its token in the UI.
        let artifacts = root.appendingPathComponent(".artifacts")
        let files = (try? FileManager.default.contentsOfDirectory(at: artifacts, includingPropertiesForKeys: [.contentModificationDateKey])) ?? []
        let logs = files.filter { $0.lastPathComponent.hasPrefix("dsh-superagent-superagent-") && $0.pathExtension == "log" }
            .sorted { $0.lastPathComponent > $1.lastPathComponent }
        let pattern = #"http://127\.0\.0\.1:3082/\?token=[A-Za-z0-9_-]+"#
        if let regex = try? NSRegularExpression(pattern: pattern) {
            for file in logs {
                guard let text = try? String(contentsOf: file, encoding: .utf8),
                      let found = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
                      let range = Range(found.range, in: text), let url = URL(string: String(text[range])) else { continue }
                return url
            }
        }
        return URL(string: "http://127.0.0.1:3082/")!
    }
    @objc func credits() {
        let alert = NSAlert(); alert.messageText = "鲸鱼娘 · 非官方社区二创"
        alert.informativeText = "上善无形「溟月」原型 / ZipZipPipe 女仆设定 / TreapGoGo 参考图。当前精灵由 ImageGen 生成，遵循 CC BY-NC-SA 4.0，署名、非商业、相同方式共享。\n\n参考图库：iphsiibl.github.io/deepseek-whale-girl-gallery/"
        alert.addButton(withTitle: "知道了"); alert.addButton(withTitle: "打开图库")
        NSApp.activate(ignoringOtherApps: true)
        if alert.runModal() == .alertSecondButtonReturn { NSWorkspace.shared.open(URL(string: "https://iphsiibl.github.io/deepseek-whale-girl-gallery/")!) }
    }
    @objc func quit() { NSApp.terminate(nil) }
    func say(_ text: String) {
        guard panel.isVisible else { return }
        bubbleTimer?.invalidate()
        let field = NSTextField(wrappingLabelWithString: text)
        field.font = .systemFont(ofSize: 12); field.textColor = NSColor(calibratedRed: 0.25, green: 0.32, blue: 0.46, alpha: 1)
        field.frame = NSRect(x: 14, y: 10, width: 212, height: 46)
        let content = NSView(frame: NSRect(x: 0, y: 0, width: 240, height: 66))
        content.wantsLayer = true; content.layer?.cornerRadius = 16
        content.layer?.backgroundColor = NSColor(calibratedRed: 0.96, green: 0.98, blue: 1, alpha: 0.98).cgColor
        content.layer?.borderWidth = 1; content.layer?.borderColor = NSColor(calibratedRed: 0.7, green: 0.78, blue: 0.93, alpha: 1).cgColor
        content.addSubview(field); bubble.contentView = content
        let screen = panel.screen ?? NSScreen.main!
        let x = max(screen.visibleFrame.minX, min(panel.frame.midX - 120, screen.visibleFrame.maxX - 240))
        let y = min(panel.frame.maxY + 4, screen.visibleFrame.maxY - 66)
        bubble.setFrame(NSRect(x: x, y: y, width: 240, height: 66), display: true); bubble.orderFrontRegardless()
        bubbleTimer = Timer.scheduledTimer(withTimeInterval: 4.5, repeats: false) { [weak self] _ in self?.bubble.orderOut(nil) }
    }
    func readState() {
        guard inFlight == nil else { return }
        var request = URLRequest(url: URL(string: "http://127.0.0.1:3082/orchestrator/api/state")!)
        request.setValue("1", forHTTPHeaderField: "x-orchestrator-request")
        inFlight = session.dataTask(with: request) { [weak self] data, response, error in
            let value = (response as? HTTPURLResponse)?.statusCode == 200 && error == nil
                ? data.flatMap { try? JSONDecoder().decode(RuntimeState.self, from: $0) } : nil
            DispatchQueue.main.async {
                guard let self else { return }
                self.inFlight = nil
                let before = self.runtime?.load.running ?? 0
                self.online = value != nil
                if let value {
                    self.runtime = value
                    if before > 0 && value.load.running == 0 && !self.sleeping {
                        self.celebratingUntil = Date().addingTimeInterval(3)
                        self.say("这轮忙完啦，可以去 GH 看看任务结果。")
                    }
                }
                self.view.setAccessibilityValue(self.displayMood.label)
                self.view.needsDisplay = true; self.refreshMenu()
            }
        }
        inFlight?.resume()
    }
}

if CommandLine.arguments.contains("--self-test") {
    let working = RuntimeState(paused: false, load: .init(running: 1, queued: 0), health: ["runtime": .init(state: "ready")])
    let idle = RuntimeState(paused: false, load: .init(running: 0, queued: 0), health: [:])
    let broken = RuntimeState(paused: false, load: .init(running: 0, queued: 0), health: ["runtime": .init(state: "error")])
    precondition(moodFor(working, sleeping: false, online: true) == .working)
    precondition(moodFor(idle, sleeping: false, online: true) == .idle)
    precondition(moodFor(working, sleeping: true, online: true) == .sleeping)
    precondition(moodFor(broken, sleeping: true, online: true) == .alert)
    precondition(moodFor(nil, sleeping: false, online: false) == .offline)
    precondition(clamped(NSPoint(x: 9000, y: -100), to: NSRect(x: 0, y: 0, width: 1440, height: 900)) == NSPoint(x: 1336, y: 0))
    precondition(clamped(NSPoint(x: -3000, y: 3000), to: NSRect(x: -1440, y: 0, width: 1440, height: 900)) == NSPoint(x: -1440, y: 770))
    precondition(PetMetrics.saved(999).art == 92)
    precondition(PetMetrics.saved(.nan).art == 92)
    precondition(PetMetrics.saved(72).window.width < PetMetrics.saved(112).window.width)
    precondition(clamped(NSPoint(x: 0, y: 0), to: NSRect(x: 0, y: 0, width: 80, height: 80)) == .zero)
    let hover = interactionPose(time: 0, hovered: true, dragging: false, pressed: false, lean: 10, landingAge: 2, happy: false, reducedMotion: false)
    precondition(hover.scaleX > 1 && hover.rotation > 0)
    let drag = interactionPose(time: 0, hovered: false, dragging: true, pressed: false, lean: 80, landingAge: 2, happy: false, reducedMotion: false)
    precondition(drag.scaleY > 1 && drag.rotation == 16)
    let landed = interactionPose(time: 0, hovered: false, dragging: false, pressed: false, lean: 0, landingAge: 0.1, happy: false, reducedMotion: false)
    precondition(landed.scaleY < 1 && landed.scaleX > 1)
    let settled = interactionPose(time: 0, hovered: false, dragging: false, pressed: false, lean: 0, landingAge: 3, happy: false, reducedMotion: false)
    precondition(settled.scaleX == 1 && settled.scaleY == 1)
    let reduced = interactionPose(time: 10, hovered: true, dragging: true, pressed: true, lean: 16, landingAge: 0.1, happy: true, reducedMotion: true)
    precondition(reduced.x == 0 && reduced.y == 0 && reduced.rotation == 0 && reduced.scaleY == 1)
    print("Desktop pet: 16 checks passed")
} else {
    let app = NSApplication.shared
    let delegate = Companion(); app.delegate = delegate; app.run()
}
