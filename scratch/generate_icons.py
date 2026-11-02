import os
import shutil
from PIL import Image

APP_LOGO_SRC = r'C:/Users/moham/.gemini/antigravity/brain/9ef94f07-7162-4733-8ae9-9a51207e0439/.user_uploaded/media_1793605119563_46000ce3.jpg'
FLOATING_LOGO_SRC = r'C:/Users/moham/.gemini/antigravity/brain/9ef94f07-7162-4733-8ae9-9a51207e0439/.user_uploaded/media_1793605142637_b0c0e85f.jpg'

def main():
    print("Loading source images...")
    app_logo = Image.open(APP_LOGO_SRC).convert("RGBA")
    floating_logo = Image.open(FLOATING_LOGO_SRC).convert("RGBA")

    # 1. Update public and app icons
    print("Updating public and homly-mobile icons...")
    app_logo.resize((512, 512), Image.Resampling.LANCZOS).save("public/logo.png", "PNG")
    app_logo.resize((512, 512), Image.Resampling.LANCZOS).save("public/homly-logo.png", "PNG")
    app_logo.resize((512, 512), Image.Resampling.LANCZOS).save("public/logo-new.png", "PNG")
    app_logo.resize((1024, 1024), Image.Resampling.LANCZOS).save("APP _ homly/homly-mobile/icon.png", "PNG")

    # Update floating logo in public
    shutil.copyfile(FLOATING_LOGO_SRC, "public/floating-logo.jpg")

    # 2. Update floating_logo.png in both Android projects (res/drawable)
    android_dirs = [
        "android/app/src/main/res",
        "APP _ homly/homly-mobile/android/app/src/main/res"
    ]

    for base_res in android_dirs:
        drawable_dir = os.path.join(base_res, "drawable")
        os.makedirs(drawable_dir, exist_ok=True)
        floating_dest = os.path.join(drawable_dir, "floating_logo.png")
        floating_logo.resize((512, 512), Image.Resampling.LANCZOS).save(floating_dest, "PNG")
        print(f"Saved floating logo to {floating_dest}")

    # 3. Create circular mask for ic_launcher_round
    def make_round(img):
        mask = Image.new('L', img.size, 0)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, img.size[0], img.size[1]), fill=255)
        out = Image.new('RGBA', img.size, (255, 255, 255, 0))
        out.paste(img, (0, 0), mask=mask)
        return out

    densities = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }

    adaptive_bg_sizes = {
        'mipmap-mdpi': 108,
        'mipmap-hdpi': 162,
        'mipmap-xhdpi': 216,
        'mipmap-xxhdpi': 324,
        'mipmap-xxxhdpi': 432,
    }

    for base_res in android_dirs:
        print(f"\nProcessing Android icons in {base_res}...")
        for density, size in densities.items():
            folder = os.path.join(base_res, density)
            os.makedirs(folder, exist_ok=True)

            resized = app_logo.resize((size, size), Image.Resampling.LANCZOS)
            launcher_path = os.path.join(folder, "ic_launcher.png")
            resized.save(launcher_path, "PNG")

            round_img = make_round(resized)
            round_path = os.path.join(folder, "ic_launcher_round.png")
            round_img.save(round_path, "PNG")

            fg_path = os.path.join(folder, "ic_launcher_foreground.png")
            resized.save(fg_path, "PNG")

            bg_size = adaptive_bg_sizes.get(density, size)
            bg_img = Image.new("RGBA", (bg_size, bg_size), (255, 255, 255, 255))
            bg_path = os.path.join(folder, "ic_launcher_background.png")
            bg_img.save(bg_path, "PNG")

    print("\nSuccessfully updated app logo and floating image in all targets!")

if __name__ == "__main__":
    main()
