const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      if (isPaytm && !activeConfig.paytmEnabled) {
        return res.status(400).json({ success: false, message: "Paytm Gateway is currently disabled by Admin." });
      }`;

const replacementStr = `      if (isPaytm) {
        if (!activeConfig.paytmMerchantKey) {
          return res.status(400).json({ 
            success: false, 
            message: "Paytm API error: Merchant Key / Checksum Key is required but not configured. Automatic payments via Paytm are unsupported with only a Merchant ID." 
          });
        }
        if (!activeConfig.paytmEnabled) {
          return res.status(400).json({ success: false, message: "Paytm Gateway is currently disabled by Admin." });
        }
      }`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content);
console.log("Updated server.ts");
