/**
 * Helper to dynamically update the App Icon and PWA Manifest across the browser
 * This ensures that when a custom logo/photo is configured, the browser favicon,
 * mobile home screen icon, and PWA install icon update seamlessly.
 */

export function updateAppIcon(iconUrl?: string, appName?: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const targetIcon = iconUrl || '/favicon.svg';
  const targetPwaIcon = iconUrl || '/pwa-icon.svg';
  const displayName = appName || 'BOL.FIX';

  try {
    // 1. Remove all existing icon links to force browser cache reset
    const existingIcons = document.querySelectorAll("link[rel*='icon']");
    existingIcons.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });

    // Detect MIME type
    let mimeType = 'image/png';
    if (targetIcon.startsWith('data:image/svg+xml') || targetIcon.endsWith('.svg')) {
      mimeType = 'image/svg+xml';
    } else if (targetIcon.startsWith('data:image/jpeg') || targetIcon.startsWith('data:image/jpg')) {
      mimeType = 'image/jpeg';
    } else if (targetIcon.startsWith('data:image/webp')) {
      mimeType = 'image/webp';
    }

    // 2. Fresh Favicon Link
    const newFavicon = document.createElement('link');
    newFavicon.id = 'app-favicon';
    newFavicon.rel = 'icon';
    newFavicon.type = mimeType;
    newFavicon.href = targetIcon;
    document.head.appendChild(newFavicon);

    // 3. Fresh Shortcut Icon Link (cross-browser compatibility)
    const newShortcut = document.createElement('link');
    newShortcut.id = 'app-shortcut-icon';
    newShortcut.rel = 'shortcut icon';
    newShortcut.type = mimeType;
    newShortcut.href = targetIcon;
    document.head.appendChild(newShortcut);

    // 4. Fresh Apple Touch Icon (iOS home screen bookmark)
    const newApple = document.createElement('link');
    newApple.id = 'app-apple-icon';
    newApple.rel = 'apple-touch-icon';
    newApple.href = targetIcon;
    document.head.appendChild(newApple);

    // 5. Update PWA Manifest dynamically so installed app displays the new icon
    updateDynamicManifest(targetPwaIcon, displayName);

    // 6. Notify in-memory listeners
    window.dispatchEvent(new CustomEvent('app_icon_changed', { detail: targetIcon }));
  } catch (err) {
    console.warn('Error applying dynamic app icon:', err);
  }
}

export function resetAppIcon() {
  updateAppIcon('/favicon.svg', 'BOL.FIX');
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    manifestLink.setAttribute('href', '/manifest.json');
  }
}

function updateDynamicManifest(iconUrl: string, appName: string) {
  try {
    const isSvg = iconUrl.startsWith('data:image/svg+xml') || iconUrl.endsWith('.svg');
    const isPng = iconUrl.startsWith('data:image/png');
    const isJpeg = iconUrl.startsWith('data:image/jpeg') || iconUrl.startsWith('data:image/jpg');
    const mimeType = isSvg ? 'image/svg+xml' : (isPng ? 'image/png' : (isJpeg ? 'image/jpeg' : 'image/png'));

    const manifestObj = {
      name: `${appName} - Gestión de Taller`,
      short_name: appName,
      description: `${appName} - Sistema de gestión integral para talleres de reparación de celulares.`,
      start_url: "/",
      scope: "/",
      id: "bol-fix-pwa-v1",
      display: "standalone",
      display_override: ["standalone", "window-controls-overlay"],
      background_color: "#111111",
      theme_color: "#111111",
      orientation: "portrait",
      categories: ["business", "utilities", "productivity"],
      icons: [
        {
          src: iconUrl,
          sizes: "72x72 96x96 128x128 144x144 152x152 192x192 384x384 512x512",
          type: mimeType,
          purpose: "any maskable"
        },
        {
          src: iconUrl,
          sizes: "192x192",
          type: mimeType,
          purpose: "any maskable"
        },
        {
          src: iconUrl,
          sizes: "512x512",
          type: mimeType,
          purpose: "any maskable"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(manifestObj, null, 2)], { type: 'application/manifest+json' });
    const manifestBlobUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      document.head.appendChild(manifestLink);
    }
    manifestLink.setAttribute('href', manifestBlobUrl);
  } catch (err) {
    console.warn('Error dynamically updating manifest:', err);
  }
}

/**
 * Generates an optimized square 512x512 app icon from an image source with
 * customizable zoom/scale (default 75%) to respect PWA maskable safe zones
 * and prevent unwanted cropping/excessive zoom.
 */
export function generateOptimizedAppIcon(
  imageSrc: string,
  zoomPercentage: number = 75
): Promise<string> {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve('/pwa-icon.svg');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        // 1. Detect background color from image corners
        let bgColor = '#111111'; // default dark theme
        try {
          const sampleCanvas = document.createElement('canvas');
          sampleCanvas.width = img.width;
          sampleCanvas.height = img.height;
          const sCtx = sampleCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(img, 0, 0);
            const corner = sCtx.getImageData(0, 0, 1, 1).data;
            if (corner[3] > 200) {
              bgColor = `rgb(${corner[0]}, ${corner[1]}, ${corner[2]})`;
            }
          }
        } catch {
          bgColor = '#000000';
        }

        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 512, 512);

        // 2. Safe-zone scale calculation (40% to 100%, default 75%)
        const clampedZoom = Math.max(40, Math.min(100, zoomPercentage));
        const maxDimension = 512 * (clampedZoom / 100);

        const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const drawX = (512 - drawWidth) / 2;
        const drawY = (512 - drawHeight) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('Error generating optimized icon:', e);
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}

