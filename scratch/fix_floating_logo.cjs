const fs = require('fs');

const files = [
  'android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java',
  'APP _ homly/homly-mobile/android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');

  // Check if foundAccepted is missing
  if (content.includes('final boolean hasAccepted = foundAccepted;') && !content.includes('boolean foundAccepted')) {
    content = content.replace(
      'if (ordersArray != null && ordersArray.length() > 0) {',
      'boolean foundAccepted = false;\n                if (ordersArray != null && ordersArray.length() > 0) {'
    );

    content = content.replace(
      'String status = order.optString("status", "");',
      'String status = order.optString("status", "");\n                            if ("Accepted".equalsIgnoreCase(status) || "Out for Delivery".equalsIgnoreCase(status) || "Shipped".equalsIgnoreCase(status)) {\n                                foundAccepted = true;\n                            }'
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully fixed foundAccepted in:', file);
  } else {
    console.log('Already has foundAccepted or not needed in:', file);
  }
});

