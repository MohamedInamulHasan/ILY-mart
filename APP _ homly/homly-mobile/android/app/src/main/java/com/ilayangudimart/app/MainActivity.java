package com.ilayangudimart.app;

import androidx.annotation.NonNull;
+
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

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import java.util.Map;

public class MainActivity extends BridgeActivity {

    private ActivityResultLauncher<String[]> locationPermissionLauncher;

    public static class SafeBridgeWebViewClient extends BridgeWebViewClient {
        public SafeBridgeWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (request != null && request.getUrl() != null) {
                if (handleExternalUrl(view.getContext(), request.getUrl().toString())) {
                    return true;
                }
            }
            return super.shouldOverrideUrlLoading(view, request);
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            if (url != null) {
                if (handleExternalUrl(view.getContext(), url)) {
                    return true;
                }
            }
            return super.shouldOverrideUrlLoading(view, url);
        }

        private boolean handleExternalUrl(Context context, String urlStr) {
            if (urlStr == null) return false;
            String trimmed = urlStr.trim();
            if (trimmed.startsWith("intent://") || trimmed.startsWith("geo:") ||
                trimmed.startsWith("tel:") || trimmed.startsWith("mailto:") ||
                trimmed.startsWith("sms:") || trimmed.startsWith("whatsapp:") ||
                trimmed.startsWith("market:") ||
                trimmed.contains("maps.google.com") || trimmed.contains("google.com/maps") ||
                trimmed.contains("maps.app.goo.gl") || trimmed.contains("goo.gl/maps")) {

                try {
                    if (trimmed.startsWith("intent://")) {
                        Intent intent = Intent.parseUri(trimmed, Intent.URI_INTENT_SCHEME);
                        if (intent != null) {
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            try {
                                context.startActivity(intent);
                                return true;
                            } catch (Exception e1) {
                                try {
                                    Intent genericIntent = new Intent(intent);
                                    genericIntent.setPackage(null);
                                    genericIntent.setComponent(null);
                                    genericIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    context.startActivity(genericIntent);
                                    return true;
                                } catch (Exception e2) {
                                    String fallback = intent.getStringExtra("browser_fallback_url");
                                    if (fallback != null && !fallback.isEmpty()) {
                                        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(fallback));
                                        browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                        context.startActivity(browserIntent);
                                        return true;
                                    }
                                }
                            }
                        }
                    } else if (trimmed.contains("maps.google.com") || trimmed.contains("google.com/maps") ||
                               trimmed.contains("maps.app.goo.gl") || trimmed.contains("goo.gl/maps")) {
                        try {
                            Intent mapIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(trimmed));
                            mapIntent.setPackage("com.google.android.apps.maps");
                            mapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            context.startActivity(mapIntent);
                            return true;
                        } catch (Exception mapEx) {
                            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(trimmed));
                            browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            context.startActivity(browserIntent);
                            return true;
                        }
                    } else {
                        Intent genericIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(trimmed));
                        genericIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(genericIntent);
                        return true;
                    }
                } catch (Exception ignored) {}
                return true; // ALWAYS return true so WebView never throws net::ERR_UNKNOWN_URL_SCHEME
            }
            return false;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingOverlayPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().getSettings().setGeolocationEnabled(true);
                getBridge().getWebView().setWebViewClient(new SafeBridgeWebViewClient(getBridge()));
            }
        } catch (Throwable ignored) {}

        // Ensure system bars (status bar / notch / nav bar) fit properly and do not hide app header
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        }

        locationPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(),
            this::handlePermissionResult
        );

        checkAndRequestLocationPermissions();
        startFloatingServiceIfPermitted();
        FloatingLogoService.setAppForegroundState(true);
        handleIncomingOrderIntent(getIntent());
    }

    @Override
    public void onDestroy() {
        startFloatingServiceIfPermitted();
        FloatingLogoService.setAppForegroundState(false);
        super.onDestroy();
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

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FloatingOverlayPlugin.REQUEST_CHECK_SETTINGS) {
            FloatingOverlayPlugin.onLocationSettingsResult(resultCode);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == FloatingOverlayPlugin.REQUEST_LOCATION_PERMISSION) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            FloatingOverlayPlugin.onPermissionResult(granted);
        }
    }

}
