package com.ilayangudimart.app;

import android.Manifest;
import android.content.Intent;
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
        handleIncomingOrderIntent(getIntent());
    }

    @Override
    public void onPause() {
        super.onPause();
        // Inform FloatingLogoService that app is in background / closed
        FloatingLogoService.setAppForegroundState(false);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Inform FloatingLogoService that app is in foreground
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
                getBridge().getWebView().postDelayed(() -> {
                    try {
                        getBridge().getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('native:open-order', { detail: { id: '" + orderId + "' } }));",
                            null
                        );
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }, 400);
            }
        }
    }

    @Override
    public void onBackPressed() {
        // Delegate to BridgeActivity so Capacitor's App.addListener('backButton') handles in-app navigation
        super.onBackPressed();
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
