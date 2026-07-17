const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const oldStr = `                </>
              )}
                <div className="flex items-center justify-end">
                  <button 
                    type="button"
                    onClick={() => { setIsForgot(true); setLocalErr(null); }}
                    className="text-xs text-gold-400 hover:text-gold-500 transition-all"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}`;

const newStr = `                </>
              )}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/components/Auth.tsx', content);
console.log('Fixed syntax in Auth.tsx');
