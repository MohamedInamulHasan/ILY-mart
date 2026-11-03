with open('src/components/NotificationOverlay.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Clean up lines 185 to 191
# Find handleOrderCreated and the closing bracket before socket.on('order:updated'
new_lines = []
skip = False
for line in lines:
    if '                    } catch (err) {' in line and lines[lines.index(line)-1].strip() == '};':
        # Skip the leftover chunk
        continue
    new_lines.append(line)

# Let's cleanly rebuild NotificationOverlay lines 150-195
content = "".join(lines)
import re
target = """        };
                    } catch (err) {
                        console.warn('System notification error:', err);
                    }
                }
            }
        };"""
if target in content:
    content = content.replace(target, "        };")
    with open('src/components/NotificationOverlay.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Cleaned leftover in NotificationOverlay.jsx")
else:
    print("Target not found directly, checking regex")
    content = re.sub(r'        \};\s+\} catch \(err\) \{\s+console\.warn\(\'System notification error:\', err\);\s+\}\s+\}\s+\}\s+\};', '        };', content)
    with open('src/components/NotificationOverlay.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Regex clean done")

