from PIL import Image
import os

logo_source = r"C:/Users/moham/.gemini/antigravity/brain/9ef94f07-7162-4733-8ae9-9a51207e0439/.user_uploaded/media_1793717591137_6753a45b.jpg"
img = Image.open(logo_source)

# Public directory files
public_dir = r"c:\Users\moham\ILAYANGUDI PROJECT\public"

# 1. logo-new.png, logo.png, homly-logo.png
img.save(os.path.join(public_dir, "logo-new.png"), "PNG")
img.save(os.path.join(public_dir, "logo.png"), "PNG")
img.save(os.path.join(public_dir, "homly-logo.png"), "PNG")
img.save(os.path.join(public_dir, "floating-logo.jpg"), "JPEG", quality=95)

# 2. PWA & Web Icons
img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "icon-192x192.png"), "PNG")
img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "icon-512x512.png"), "PNG")
img.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")

# 3. Favicon.ico
favicon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
img.save(os.path.join(public_dir, "favicon.ico"), format="ICO", sizes=favicon_sizes)

print("Updated all public/ logo files successfully.")

# Android directories
android_dirs = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\res",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\src\main\res"
]

for res_dir in android_dirs:
    # floating_logo
    drawable_dir = os.path.join(res_dir, "drawable")
    if os.path.exists(drawable_dir):
        img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(drawable_dir, "floating_logo.png"), "PNG")
    
    # mipmap densities
    densities = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432)
    }
    
    for density, (icon_size, fg_size) in densities.items():
        density_dir = os.path.join(res_dir, density)
        if os.path.exists(density_dir):
            # ic_launcher.png
            img.resize((icon_size, icon_size), Image.Resampling.LANCZOS).save(os.path.join(density_dir, "ic_launcher.png"), "PNG")
            # ic_launcher_round.png
            img.resize((icon_size, icon_size), Image.Resampling.LANCZOS).save(os.path.join(density_dir, "ic_launcher_round.png"), "PNG")
            # ic_launcher_foreground.png
            img.resize((fg_size, fg_size), Image.Resampling.LANCZOS).save(os.path.join(density_dir, "ic_launcher_foreground.png"), "PNG")

print("Updated all Android launcher icons and floating logos successfully.")

