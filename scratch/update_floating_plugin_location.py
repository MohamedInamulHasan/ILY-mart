import os

plugin_paths = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\java\com\ilayangudimart\app\FloatingOverlayPlugin.java",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\src\main\java\com\ilayangudimart\app\FloatingOverlayPlugin.java"
]

extra_imports = """import androidx.core.app.ActivityCompat;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.Priority;
import com.google.android.gms.location.SettingsClient;
import com.google.android.gms.tasks.Task;
"""

new_location_code = """
    public static final int REQUEST_CHECK_SETTINGS = 8001;
    public static final int REQUEST_LOCATION_PERMISSION = 8002;
    private static PluginCall pendingLocationSettingsCall = null;
    private static PluginCall pendingPermissionCall = null;

    public static void onLocationSettingsResult(int resultCode) {
        if (pendingLocationSettingsCall != null) {
            PluginCall call = pendingLocationSettingsCall;
            pendingLocationSettingsCall = null;
            JSObject ret = new JSObject();
            ret.put("enabled", resultCode == android.app.Activity.RESULT_OK);
            call.resolve(ret);
        }
    }

    public static void onPermissionResult(boolean granted) {
        if (pendingPermissionCall != null) {
            PluginCall call = pendingPermissionCall;
            pendingPermissionCall = null;
            JSObject ret = new JSObject();
            ret.put("granted", granted);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestLocationPermission(PluginCall call) {
        try {
            boolean fine = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            boolean coarse = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            if (fine || coarse) {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                ret.put("alreadyGranted", true);
                call.resolve(ret);
                return;
            }

            pendingPermissionCall = call;
            ActivityCompat.requestPermissions(
                getActivity(),
                new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                REQUEST_LOCATION_PERMISSION
            );
        } catch (Exception e) {
            call.reject("PERMISSION_ERROR", e.getMessage());
        }
    }

    @PluginMethod
    public void promptEnableLocation(PluginCall call) {
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            boolean isGpsEnabled = lm != null && (lm.isProviderEnabled(LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER));

            if (isGpsEnabled) {
                JSObject ret = new JSObject();
                ret.put("enabled", true);
                ret.put("alreadyEnabled", true);
                call.resolve(ret);
                return;
            }

            LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000)
                    .setMinUpdateIntervalMillis(5000)
                    .build();

            LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder()
                    .addLocationRequest(locationRequest)
                    .setAlwaysShow(true);

            SettingsClient client = LocationServices.getSettingsClient(getActivity());
            Task<LocationSettingsResponse> task = client.checkLocationSettings(builder.build());

            task.addOnSuccessListener(getActivity(), locationSettingsResponse -> {
                JSObject ret = new JSObject();
                ret.put("enabled", true);
                call.resolve(ret);
            });

            task.addOnFailureListener(getActivity(), e -> {
                if (e instanceof ResolvableApiException) {
                    try {
                        pendingLocationSettingsCall = call;
                        ResolvableApiException resolvable = (ResolvableApiException) e;
                        resolvable.startResolutionForResult(getActivity(), REQUEST_CHECK_SETTINGS);
                    } catch (Exception ex) {
                        tryFallbackLocationSettings(call);
                    }
                } else {
                    tryFallbackLocationSettings(call);
                }
            });
        } catch (Exception e) {
            tryFallbackLocationSettings(call);
        }
    }

    private void tryFallbackLocationSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("enabled", false);
            ret.put("openedSettings", true);
            call.resolve(ret);
        } catch (Exception ex) {
            call.reject("FAILED_TO_PROMPT", ex.getMessage());
        }
    }
"""

for p in plugin_paths:
    with open(p, "r", encoding="utf-8") as f:
        content = f.read()

    # Add extra imports if not present
    if "com.google.android.gms.location.LocationRequest" not in content:
        c_idx = content.find("@CapacitorPlugin(name = \"FloatingOverlay\")")
        content = content[:c_idx] + extra_imports + "\n" + content[c_idx:]

    # Add new methods before last closing brace
    if "promptEnableLocation" not in content:
        r_idx = content.rfind("}")
        content = content[:r_idx] + new_location_code + "\n}\n"
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {p}")
    else:
        print(f"Already updated {p}")

print("Plugin location methods added.")
