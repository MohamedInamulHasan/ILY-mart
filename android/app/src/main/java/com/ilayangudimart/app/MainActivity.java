package com.ilayangudimart.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import java.util.Map;

public class MainActivity extends BridgeActivity {

    private boolean handleCustomExternalUrl(String urlStr) {
        if (urlStr == null || urlStr.isEmpty()) return false;

        // 1. Handle intent:// URLs (e.g. Google Maps redirect)
        if (urlStr.startsWith("intent://")) {
            try {
                Intent intent = Intent.parseUri(urlStr, Intent.URI_INTENT_SCHEME);
                if (intent != null) {
                    PackageManager pm = getPackageManager();
                    if (intent.resolveActivity(pm) != null || intent.getPackage() != null) {
                        startActivity(intent);
                        return true;
                    }
                    String fallbackUrl = intent.getStringExtra("browser_fallback_url");
                    if (fallbackUrl != null) {
                        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(fallbackUrl));
                        startActivity(browserIntent);
                        return true;
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return true; // Return true so WebView never crashes with net::ERR_UNKNOWN_URL_SCHEME
        }

        // 2. Handle maps, geo, tel, mailto, whatsapp schemes/domains
        if (urlStr.startsWith("geo:") || urlStr.startsWith("tel:") || urlStr.startsWith("mailto:") || urlStr.startsWith("whatsapp:") ||
            urlStr.contains("maps.google.com") || urlStr.contains("google.com/maps") || urlStr.contains("maps.app.goo.gl")) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(urlStr));
                startActivity(intent);
                return true;
            } catch (Exception e) {
                e.printStackTrace();
            }
            return true;
        }

        return false;
    }


    private ActivityResultLauncher<String[]> locationPermissionLauncher;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingOverlayPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().getSettings().setGeolocationEnabled(true);
                getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        if (request != null && request.getUrl() != null) {
                            String urlStr = request.getUrl().toString();
                            if (handleCustomExternalUrl(urlStr)) {
                                return true;
                            }
                        }
                        return super.shouldOverrideUrlLoading(view, request);
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        if (url != null && handleCustomExternalUrl(url)) {
                            return true;
                        }
                        return super.shouldOverrideUrlLoading(view, url);
                    }
                });
            }
        } catch (Exception ignored) {}

        // Enable edge-to-edge display
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        } else {
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            );
        }

        locationPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(),
            this::handlePermissionResult
        );

        checkAndRequestLocationPermissions();
        try {
            Intent stopIntent = new Intent(this, FloatingLogoService.class);
            stopIntent.setAction("STOP_SERVICE");
            stopService(stopIntent);
        } catch (Exception ignored) {}
        handleIncomingOrderIntent(getIntent());
    }

    private void startFloatingServiceIfPermitted() {
        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean("floating_enabled", false);
        boolean sessionActive = prefs.getBoolean("delivery_session_active", false);
        if (enabled && sessionActive && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.canDrawOverlays(this)) {
            try {
                Intent serviceIntent = new Intent(this, FloatingLogoService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent);
                } else {
                    startService(serviceIntent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            try {
                Intent stopIntent = new Intent(this, FloatingLogoService.class);
                stopIntent.setAction("STOP_SERVICE");
                stopService(stopIntent);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Start floating service & show floating bubble when app is in background / closed
        startFloatingServiceIfPermitted();
        FloatingLogoService.setAppForegroundState(false);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Start floating service if enabled & hide circle bubble while inside the app
        startFloatingServiceIfPermitted();
        FloatingLogoService.setAppForegroundState(true);
        handleIncomingOrderIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingOrderIntent(intent);
    }

    private void handleIncomingOrderIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("open_incoming_order", false)) {
            String orderId = intent.getStringExtra("order_id");
            if (orderId != null && getBridge() != null && getBridge().getWebView() != null) {
                String js = "(function() {" +
                            "  var id = '" + orderId + "';" +
                            "  window.__pendingNativeOrderId = id;" +
                            "  window.dispatchEvent(new CustomEvent('native:open-order', { detail: { id: id } }));" +
                            "})();";
                getBridge().getWebView().postDelayed(() -> {
                    try { getBridge().getWebView().evaluateJavascript(js, null); } catch (Exception ignored) {}
                }, 300);
                getBridge().getWebView().postDelayed(() -> {
                    try { getBridge().getWebView().evaluateJavascript(js, null); } catch (Exception ignored) {}
                }, 800);
                getBridge().getWebView().postDelayed(() -> {
                    try { getBridge().getWebView().evaluateJavascript(js, null); } catch (Exception ignored) {}
                }, 1600);
            }
        }
    }

    @Override
    public void onBackPressed() {
        // Safe in-app back navigation: close modals first, go back through history, or minimize at root
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "(function() {" +
                "  try {" +
                "    var path = window.location.pathname || '';" +
                "    var isDeliveryScreen = (path === '/admin' || path.indexOf('/admin/delivery') !== -1);" +
                "    var isDeliveryBoy = (localStorage.getItem('delivery_session_active') === 'true' && localStorage.getItem('delivery_boy_logged_out') !== 'true');" +
                "    if (window.__handleBackButton) {" +
                "      var res = window.__handleBackButton();" +
                "      if (res === true) { return 'handled'; }" +
                "      if (res === false) { return 'exit'; }" +
                "    }" +
                "    if (isDeliveryScreen && isDeliveryBoy) { return 'handled'; }" +
                "    if (window.history.state && window.history.state.idx > 0) { window.history.back(); return 'navigated'; }" +
                "    if (path !== '/' && path !== '/home' && path !== '/admin') {" +
                "      window.location.href = '/';" +
                "      return 'navigated';" +
                "    }" +
                "  } catch (e) {}" +
                "  return 'exit';" +
                "})();",
                result -> {
                    if (result != null && (result.contains("exit") || "false".equals(result))) {
                        moveTaskToBack(true);
                    }
                }
            );
        } else {
            moveTaskToBack(true);
        }
    }

    private void checkAndRequestLocationPermissions() {
        boolean fineGranted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        boolean coarseGranted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        if (!fineGranted || !coarseGranted) {
            locationPermissionLauncher.launch(new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            });
        }
    }

    private void handlePermissionResult(Map<String, Boolean> permissions) {
        // Handled silently
    }
}
