package com.ilayangudimart.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

import java.util.Map;

public class MainActivity extends BridgeActivity {

    // Modern Activity Result API launcher for multiple permissions
    private ActivityResultLauncher<String[]> locationPermissionLauncher;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure system bars (status bar / notch / nav bar) fit properly and do not hide app header
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        }

        // Register the permission launcher BEFORE requesting permissions
        locationPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(),
            this::handlePermissionResult
        );

        // Request permissions on startup
        checkAndRequestLocationPermissions();
    }

    /**
     * Checks current permission status and requests if not already granted.
     * Works across Android 10, 11, 12, 13, 14+
     */
    private void checkAndRequestLocationPermissions() {
        boolean fineGranted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        boolean coarseGranted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        if (!fineGranted || !coarseGranted) {
            // Request both permissions — system handles the dialog
            locationPermissionLauncher.launch(new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            });
        }
        // If already granted, do nothing — GPS logic handled in JS layer
    }

    /**
     * Callback for permission result.
     * - Granted: do nothing (Capacitor Geolocation plugin takes over)
     * - Denied: show a gentle toast (no redirect to Settings)
     * - Permanently Denied (shouldShowRationale = false after denial):
     *   on next app restart, the system will request again since we
     *   always call checkAndRequestLocationPermissions() in onCreate.
     *
     * Note: Android manages "permanently denied" state internally. After 2
     * denials the system stops showing the dialog, so we do not re-request
     * in the same session to respect the user's decision.
     */
    private void handlePermissionResult(Map<String, Boolean> results) {
        Boolean fineGranted = results.get(Manifest.permission.ACCESS_FINE_LOCATION);
        Boolean coarseGranted = results.get(Manifest.permission.ACCESS_COARSE_LOCATION);

        boolean anyGranted = Boolean.TRUE.equals(fineGranted) || Boolean.TRUE.equals(coarseGranted);

        if (!anyGranted) {
            // Inform user gracefully — no Settings redirect
            Toast.makeText(
                this,
                "Location permission is needed to show nearby stores.",
                Toast.LENGTH_LONG
            ).show();
        }
        // If granted: Capacitor's Geolocation plugin handles everything from JS
    }
}
