const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Desktop hamburger button 1
content = content.replace(
/(\s*)(\{sidebarCollapsed \? \(\n\s*<div className="flex flex-col items-center p-4 border-b border-white\/5 gap-3\.5 shrink-0 w-full">\n(?:[\s\S]*?)<\/div>\n\s*\{.*?\}\n\s*<\/div>\n\s*){\/\* Hamburger Button below the Logo \*\/}\n\s*<button[\s\S]*?<Menu className="w-5 h-5" \/>\n\s*<\/button>/m,
`$1$2{deviceType === 'desktop' && (
$1  <button 
$1    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
$1    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gold-400 hover:text-white transition-all cursor-pointer flex items-center justify-center border border-white/5"
$1    title="Expand Sidebar"
$1  >
$1    <Menu className="w-5 h-5" />
$1  </button>
$1)}`
);

// 2. Desktop hamburger button 2
content = content.replace(
/(\s*)(\{brandingSettings\?\.websiteName \|\| 'TITAN ESPORTS'\}\n\s*<\/span>\n\s*){\/\* Hamburger Button below the Name \*\/}\n\s*<button[\s\S]*?<Menu className="w-5 h-5" \/>\n\s*<\/button>/m,
`$1$2{deviceType === 'desktop' && (
$1  <button 
$1    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
$1    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gold-400 hover:text-white transition-all cursor-pointer flex items-center justify-center border border-white/5 mt-1"
$1    title="Collapse Sidebar"
$1  >
$1    <Menu className="w-5 h-5" />
$1  </button>
$1)}`
);

// 3. Remove Mobile Drawer button
content = content.replace(
/\s*{\/\* Action icons right \*\/}\n\s*<div className="flex items-center gap-2">\n\s*{\/\* Hamburger \/ Menu toggle button \*\/}\n\s*<button\s*onClick=\{\(\) => setShowMobileDrawer\(true\)\}[\s\S]*?<\/button>\n\s*<\/div>/m,
``
);

// 4. Remove Mobile Drawer Overlay entirely
content = content.replace(
/\s*{\/\* --- MOBILE DRAWER \/ SIDE SHEET OVERLAY --- \*\/}\n\s*<AnimatePresence>\n\s*\{showMobileDrawer && \([\s\S]*?<\/AnimatePresence>/m,
``
);

// 5. Remove state
content = content.replace(
/  const \[showMobileDrawer, setShowMobileDrawer\] = useState\(false\);\n/,
''
);

fs.writeFileSync('src/App.tsx', content);
