const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const targetContent = `                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Loading Title</label>
                    <input
                      type="text"
                      value={localSettings.loadingTitle || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const words = val.trim().split(' ');
                        const firstWord = words[0] || '';
                        const restWords = words.slice(1).join(' ') || '';
                        setLocalSettings(p => ({ 
                          ...p, 
                          loadingTitle: val,
                          splashMainTitle: firstWord,
                          splashSecondaryTitle: restWords,
                          splashTitle: val
                        }));
                      }}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. VICTORY ARENA"
                    />
                  </div>`;

const newContent = `                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Main Title</label>
                    <input
                      type="text"
                      value={localSettings.splashMainTitle || localSettings.loadingTitle || ''}
                      onChange={e => {
                        setLocalSettings(p => ({ 
                          ...p, 
                          splashMainTitle: e.target.value,
                          loadingTitle: e.target.value
                        }));
                      }}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. VICTORY"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Secondary Title</label>
                    <input
                      type="text"
                      value={localSettings.splashSecondaryTitle || ''}
                      onChange={e => {
                        setLocalSettings(p => ({ 
                          ...p, 
                          splashSecondaryTitle: e.target.value
                        }));
                      }}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. ARENA"
                    />
                  </div>`;

content = content.replace(targetContent, newContent);

// Remove the sync logic from handleSave for Text
const textSyncTarget = `      // Synchronize text and color keys for complete Loading Page Configuration compliance
      const defaultTitle = \`\${processedSettings.splashMainTitle || 'VICTORY'} \${processedSettings.splashSecondaryTitle || 'ARENA'}\`.trim();
      processedSettings.loadingTitle = processedSettings.loadingTitle || defaultTitle || 'VICTORY ARENA';`;

const textSyncReplacement = `      // Synchronize text and color keys for complete Loading Page Configuration compliance
      processedSettings.loadingTitle = processedSettings.splashMainTitle || processedSettings.loadingTitle || 'VICTORY';`;

content = content.replace(textSyncTarget, textSyncReplacement);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
