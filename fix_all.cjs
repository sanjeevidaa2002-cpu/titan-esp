const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

// Replace leftover Option 2: Custom Upload text
content = content.replace(/{[\/\s]*Option 2: Custom Upload[\s\*]*}/g, '{/* Option 2: Custom URL */}');
content = content.replace(/{[\/\s]*Column 2: Custom Mascot Upload[\s\*]*}/g, '{/* Column 2: Custom Mascot URL */}');

// Let's remove handleCropToSquare fully if it's still there
const cropRegex = /const handleCropToSquare = async.*?\}\};\n/s;
content = content.replace(cropRegex, '');

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
