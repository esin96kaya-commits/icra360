import SwiftUI
import WebKit

@main
struct Icra360App: App {
    var body: some Scene {
        WindowGroup {
            WebRootView()
                .ignoresSafeArea()
                .preferredColorScheme(.light)
        }
    }
}

struct WebRootView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true

        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences = preferences
        config.allowsInlineMediaPlayback = true
        config.websiteDataStore = .default()

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = true
        webView.isOpaque = true
        let navy = UIColor(red: 20 / 255, green: 43 / 255, blue: 74 / 255, alpha: 1)
        webView.backgroundColor = navy
        webView.scrollView.backgroundColor = navy
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif

        let start = URL(string: "http://127.0.0.1:3000/dashboard")!
        webView.load(URLRequest(url: start, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        private var recoveredFromCrash = false

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            guard !recoveredFromCrash else { return }
            let js = """
            (function () {
              const text = (document.body && document.body.innerText) || '';
              if (text.indexOf('Application error:') !== -1) {
                location.replace('/dashboard');
                return true;
              }
              return false;
            })();
            """
            webView.evaluateJavaScript(js) { result, _ in
                if result as? Bool == true {
                    self.recoveredFromCrash = true
                }
            }
        }
    }
}
