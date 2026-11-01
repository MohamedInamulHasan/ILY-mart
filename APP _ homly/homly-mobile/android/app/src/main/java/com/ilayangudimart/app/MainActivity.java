package com.ilayangudimart.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
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
    }

    @Override
    public void onPause() {
        super.onPause();
        // Show Porter-style floating logo over the screen if permission is granted
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.canDrawOverlays(this)) {
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
    public void onResume() {
        super.onResume();
        // Hide floating logo when app is in foreground
        try {
            Intent serviceIntent = new Intent(this, FloatingLogoService.class);
            stopService(serviceIntent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onBackPressed() {
        // Porter partner style: Move task to background rather than destroying process
        moveTaskToBack(true);
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
