package com.ilayangudimart.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.WindowManager;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

import java.util.Map;

public class MainActivity extends BridgeActivity {

    private ActivityResultLauncher<String[]> locationPermissionLauncher;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingOverlayPlugin.class);
        super.onCreate(savedInstanceState);

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
        startFloatingServiceIfPermitted();
        handleIncomingOrderIntent(getIntent());
    }

    private void startFloatingServiceIfPermitted() {
        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean("floating_enabled", true);
        if (enabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.canDrawOverlays(this)) {
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
                "    var isDel = (localStorage.getItem('delivery_session_active') === 'true' && localStorage.getItem('delivery_boy_logged_out') !== 'true') || window.location.pathname.indexOf('/admin/delivery-order') !== -1;" +
                "    if (isDel) { return 'handled'; }" +
                "    if (window.__handleBackButton && window.__handleBackButton()) { return 'handled'; }" +
                "    if (window.history.state && window.history.state.idx > 0) { window.history.back(); return 'navigated'; }" +
                "    if (window.location.pathname !== '/' && window.location.pathname !== '/home' && window.location.pathname !== '/admin') {" +
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
