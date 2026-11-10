import os

# 1. Update build.gradle
gradle_paths = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\build.gradle",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\build.gradle"
]

for gp in gradle_paths:
    with open(gp, "r", encoding="utf-8") as f:
        content = f.read()
    
    dep_target = "implementation project(':capacitor-android')"
    if "com.google.android.gms:play-services-location" not in content:
        content = content.replace(dep_target, dep_target + "\n    implementation 'com.google.android.gms:play-services-location:21.3.0'")
        with open(gp, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {gp}")
    else:
        print(f"Already updated {gp}")

# 2. Update MainActivity.java
main_paths = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\java\com\ilayangudimart/app\MainActivity.java",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\src\main\java\com\ilayangudimart/app\MainActivity.java"
]

main_activity_methods = """
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
"""

for mp in main_paths:
    with open(mp, "r", encoding="utf-8") as f:
        content = f.read()

    # Ensure @NonNull import
    if "import androidx.annotation.NonNull;" not in content:
        content = "import androidx.annotation.NonNull;\n" + content

    if "REQUEST_CHECK_SETTINGS" not in content:
        # Insert before the last closing brace
        r_idx = content.rfind("}")
        if r_idx != -1:
            content = content[:r_idx] + main_activity_methods + "\n}\n"
            with open(mp, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated {mp}")
    else:
        print(f"Already updated {mp}")

print("Gradle and MainActivity updated.")
