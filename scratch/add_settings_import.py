paths = [
    'android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java',
    'APP _ homly/homly-mobile/android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java'
]

for p in paths:
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()

    target = "import android.os.VibrationEffect;"
    replacement = "import android.os.VibrationEffect;\nimport android.provider.Settings;"

    if target in text:
        text = text.replace(target, replacement, 1)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'Added import to {p}')
    else:
        print(f'Target not found in {p}')
