import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    var pendingFileURL: URL?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Handle file opening from share sheet or "Open In"
        if url.isFileURL {
            pendingFileURL = url
            notifyWebLayer(fileURL: url)
            return true
        }
        return CAPBridge.handleOpenUrl(url, options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        if let url = userActivity.webpageURL {
            return CAPBridge.handleOpenUrl(url, nil)
        }
        return false
    }

    private func notifyWebLayer(fileURL: URL) {
        // Access the file, read it, and send to web layer via base64
        let _ = startAccessingSecurityScopedResource(fileURL: fileURL)

        defer {
            stopAccessingSecurityScopedResource(fileURL: fileURL)
        }

        guard let data = try? Data(contentsOf: fileURL) else { return }
        let base64 = data.base64EncodedString()
        let fileName = fileURL.lastPathComponent

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if let webViewCap = self.getWindowVC()?.bridge?.webView {
                let js = "window.handleFileFromNative && window.handleFileFromNative(\"" + base64.replacingOccurrences(of: "\"", with: "\\\"") + "\", \"" + fileName + "\")"
                webViewCap.evaluateJavaScript(js, completionHandler: nil)
            }
        }
    }

    private func startAccessingSecurityScopedResource(fileURL: URL) -> Bool {
        // Required for files from document picker / share sheet
        if fileURL.startAccessingSecurityScopedResource() {
            return true
        }
        return false
    }

    private func stopAccessingSecurityScopedResource(fileURL: URL) {
        fileURL.stopAccessingSecurityScopedResource()
    }

    private func getWindowVC() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene
        return scene?.windows.first?.rootViewController
    }
}
