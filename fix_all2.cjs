const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const bad1 = `  });
      }
  });
  // ==========================================
  // PAYMENT CONFIG, WEBHOOKS & AUTO SYSTEMS
      }
  });
  // ==========================================`;

const good1 = `  });
  // ==========================================
  // PAYMENT CONFIG, WEBHOOKS & AUTO SYSTEMS
  // ==========================================`;

content = content.replace(bad1, good1);
fs.writeFileSync(file, content);
