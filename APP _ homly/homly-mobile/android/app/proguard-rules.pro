# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Uncomment this to preserve the line number information for
# debugging stack traces.
-keepattributes SourceFile,LineNumberTable

# =============================================
# Capacitor - REQUIRED to prevent crash on launch
# =============================================
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepattributes *Annotation*
-keepclassmembers class com.ilayangudimart.app.** { *; }

# Capacitor official plugins
-keep class com.capacitorjs.plugins.** { *; }

# WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Kotlin
-keep class kotlin.** { *; }
-keepclassmembers class **$WhenMappings { *; }
-keep class kotlin.Metadata { *; }

# Coroutines
-keepclassmembers class kotlinx.coroutines.** { *; }

# AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Google Play Services (Location)
-keep class com.google.android.gms.** { *; }

# Keep R8 from removing the splash screen entry point
-keep class androidx.core.splashscreen.** { *; }
