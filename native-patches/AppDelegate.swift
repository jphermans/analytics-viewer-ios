import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Handle file opening from share sheet or "Open In"
        if url.isFileURL {
            notifyWebLayer(fileURL: url)
            return true
        }
        return CAPBridge.handleOpenUrl(url, options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return CAPBridge.handleContinueActivity(userActivity)
    }

    private func notifyWebLayer(fileURL: URL) {
        // Access security-scoped resource (needed for Files app / share sheet)
        let accessing = url.startAccessingSecurityScopedResource()
        defer { if accessing { fileURL.stopAccessingSecurityScopedResource() } }

        guard let data = try? Data(contentsOf: fileURL) else { return }
        let base64 = data.base64EncodedString()
        let fileName = fileURL.lastPathComponent

        // Wait for the WebView to be ready, then call the JS handler
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            guard let bridgeVC = self?.topViewController() as? CAPBridgeViewController,
                  let webView = bridgeVC.bridge?.webView else { return }
            let escaped = base64
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "\"", with: "\\\"")
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\n")
            let escapedName = fileName
                .replacingOccurrences(of: "\"", with: "\\\"")
                .replacingOccurrences(of: "'", with: "\\'")
            let js = "if(window.handleFileFromNative)window.handleFileFromNative(\"\(escaped)\",\"\(escapedName)\")"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    private func topViewController() -> UIViewController? {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else { return nil }
        var top = root
        while let presented = top.presentedViewController {
            top = presented
        }
        return top
    }
}
