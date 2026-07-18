const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

code = code.replace(/const \{ brandingSettings \} = useGame\(\);/, "const { loadingScreenSettings } = useGame();");

const cacheBusterImpl = `
  const getCacheBustedUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
        
    // Split to remove any existing v= from the stored database URL
    const baseUrl = url.split('?v=')[0].split('&v=')[0];
        
    // Use updatedAt if present, otherwise cacheBuster
    const version = loadingScreenSettings?.updatedAt || cacheBuster;
    return \`\${baseUrl}\${baseUrl.includes('?') ? '&' : '?'}v=\${version}\`;
  };

  const displayLogoUrl = getCacheBustedUrl(loadingScreenSettings?.loadingLogoUrl || '');
  const bgImageUrl = getCacheBustedUrl(loadingScreenSettings?.backgroundImage || '');
  const bgColor = loadingScreenSettings?.backgroundColor || '#08080c';
  const mainTitle = loadingScreenSettings?.loadingTitle || 'TITAN ESPORTS';
  const secondaryTitle = loadingScreenSettings?.loadingSubtitle || 'PREMIUM GAMING';
  const loadingText = loadingScreenSettings?.loadingText || 'INITIALIZING SYSTEM';
  const showProgressBar = loadingScreenSettings?.progressBarEnabled !== false;
  const showAnimation = loadingScreenSettings?.animationEnabled !== false;
`;

code = code.replace(/const getCacheBustedUrl = \(url: string\) => \{[\s\S]*?const bgImageUrl = [^;]+;/, cacheBusterImpl);

code = code.replace(/const mainTitle = [^;]+;/g, "");
code = code.replace(/const secondaryTitle = [^;]+;/g, "");
code = code.replace(/const subtitle = [^;]+;/g, "");
code = code.replace(/const loadingText = [^;]+;/g, "");
code = code.replace(/const loadingTextColor = [^;]+;/g, "");
code = code.replace(/const minLoadingTime = [^;]+;/g, "");
code = code.replace(/const maxLoadingTime = [^;]+;/g, "");
code = code.replace(/const loadingDuration = [^;]+;/g, "");
code = code.replace(/const redirectDelay = [^;]+;/g, "");

// find useEffect mapping
code = code.replace(/const intervalTime = Math\.max\(20, loadingDuration \/ 100\);/g, "const intervalTime = Math.max(20, 2500 / 100);");
code = code.replace(/\[onFinished, loadingDuration, redirectDelay\]\);/g, "[onFinished]);");
code = code.replace(/redirectDelay\);/g, "800);");

fs.writeFileSync('src/components/SplashScreen.tsx', code);
