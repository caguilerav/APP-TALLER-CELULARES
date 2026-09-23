import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share, PlusSquare, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Check if the current view is in Mobile Mode (mobile viewport or mobile device)
export const isMobileMode = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Viewport width check: screen width < 768px corresponds to Tailwind mobile mode (< md)
  if (window.innerWidth < 768) {
    return true;
  }

  // Device check: smartphones and tablets (Android, iOS, iPad, etc.)
  const ua = (navigator.userAgent || '').toLowerCase();
  const isMobileOrTablet =
    /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua) ||
    ((navigator.platform || '').toLowerCase().includes('mac') && (navigator.maxTouchPoints || 0) > 1);

  return isMobileOrTablet;
};

export default function PWAInstallPrompt() {
  const [inMobileMode, setInMobileMode] = useState<boolean>(() => isMobileMode());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [showInstallHelpModal, setShowInstallHelpModal] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Listen for resize / orientation change to dynamically check mobile mode vs web mode
    const handleResize = () => {
      setInMobileMode(isMobileMode());
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Clean legacy permanent dismissal from localStorage if present so mobile users can see it
    try {
      localStorage.removeItem('pwa_banner_dismissed');
    } catch {
      // ignore
    }

    // Check if app is running in standalone mode (already installed as PWA) or previously installed
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('pwa_app_installed') === 'true';

    if (isStandaloneMode) {
      setIsStandalone(true);
      setShowBanner(false);
    }

    // Check if user manually dismissed banner in this session
    try {
      if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
        setShowBanner(false);
      }
    } catch {
      // ignore
    }

    // Detect iOS / Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIPhoneOrIPad);

    // Listen for standalone display mode changes dynamically
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setShowBanner(false);
        localStorage.setItem('pwa_app_installed', 'true');
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event captured');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      localStorage.setItem('pwa_app_installed', 'true');
      setIsStandalone(true);
      setShowBanner(false);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted installation');
          localStorage.setItem('pwa_app_installed', 'true');
          setIsStandalone(true);
          setShowBanner(false);
          setInstalledSuccess(true);
        } else {
          console.log('[PWA] User dismissed install prompt');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('[PWA] Error triggering install prompt:', err);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowInstallHelpModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    try {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  // Only show in Mobile Mode (< 768px or mobile devices).
  // Strictly hidden in Web Mode (Desktop screens >= 768px) and when already installed.
  if (!inMobileMode || isStandalone) {
    return null;
  }

  return (
    <>
      {/* Translucent Cloud Banner (Nube semi-transparente) - Solo visible en móviles / no en PC */}
      {showBanner && (
        <div className="md:hidden mx-3 my-2 bg-black/75 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-2.5 px-3.5 flex items-center justify-between gap-3 text-white transition-all animate-fade-in z-30">
          {/* Left Side: App Icon & Title */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FACC15] to-amber-500 text-black font-black flex items-center justify-center shrink-0 shadow-md shadow-yellow-500/20">
              <Smartphone className="w-4.5 h-4.5 text-black" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-extrabold tracking-wide text-white truncate">
                  BOL.FIX
                </span>
                <span className="bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/40 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  App
                </span>
              </div>
              <p className="text-[10px] text-gray-300 font-medium truncate">
                Instala la app nativa en tu dispositivo
              </p>
            </div>
          </div>

          {/* Right Side: Install Button & Close */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-[#FACC15] hover:bg-yellow-400 text-black font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-yellow-500/20 transition-all transform active:scale-95 hover:scale-[1.02] cursor-pointer uppercase tracking-wider"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Instalar App</span>
            </button>

            <button
              onClick={handleDismissBanner}
              className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Notification after install */}
      {installedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-[#FACC15] border border-[#FACC15] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-black animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-[#FACC15]" />
          <span>¡Aplicación instalada con éxito! Ya está disponible en tu pantalla principal.</span>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-gray-900 shadow-2xl border border-gray-100 space-y-5 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-black text-[#FACC15] rounded-3xl mx-auto flex items-center justify-center shadow-lg">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Instalar en iPhone / iPad</h3>
              <p className="text-xs text-gray-500">
                Sigue estos dos sencillos pasos en Safari para tener la aplicación nativa en tu pantalla de inicio:
              </p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-150 text-xs">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-black text-[#FACC15] font-black flex items-center justify-center text-xs shrink-0">
                  1
                </div>
                <div className="pt-0.5">
                  <p className="font-extrabold text-gray-900">Toca el botón Compartir</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    Ubicado en la barra del navegador <Share className="w-3.5 h-3.5 text-blue-600 inline" />
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2 border-t border-gray-200">
                <div className="w-6 h-6 rounded-full bg-black text-[#FACC15] font-black flex items-center justify-center text-xs shrink-0">
                  2
                </div>
                <div className="pt-0.5">
                  <p className="font-extrabold text-gray-900">Selecciona "Agregar a inicio"</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    O en inglés "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-gray-800 inline" />
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-black text-[#FACC15] font-black py-3 rounded-2xl hover:bg-gray-800 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* General PWA Installation Help Modal (Android / Chrome / PC) */}
      {showInstallHelpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-gray-900 shadow-2xl border border-gray-100 space-y-5 relative">
            <button
              onClick={() => setShowInstallHelpModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-black text-[#FACC15] rounded-3xl mx-auto flex items-center justify-center shadow-lg">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Instalar Aplicación Nativa</h3>
              <p className="text-xs text-gray-500">
                Para instalar la app directamente en tu teléfono, tablet o computadora sin pasar por tiendas de aplicaciones:
              </p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
              <div className="space-y-2">
                <p className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-black" /> En Android / Chrome Móvil:
                </p>
                <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1 text-[11px]">
                  <li>Abre el menú de 3 puntos (<b>⋮</b>) arriba a la derecha.</li>
                  <li>Toca en <b>"Instalar aplicación"</b> o <b>"Agregar a la pantalla principal"</b>.</li>
                </ol>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200">
                <p className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-black" /> En PC / Mac / Chrome / Edge:
                </p>
                <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1 text-[11px]">
                  <li>Haz clic en el icono de instalación (🖥️ / ➕) en la barra de direcciones de la derecha.</li>
                  <li>O abre el menú de opciones y elige <b>"Instalar BOL.FIX"</b>.</li>
                </ol>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200">
                <p className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  <Share className="w-4 h-4 text-blue-600" /> En iPhone / Safari (iOS):
                </p>
                <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1 text-[11px]">
                  <li>Toca el botón <b>Compartir</b> (<Share className="w-3 h-3 inline text-blue-600" />).</li>
                  <li>Selecciona <b>"Agregar a inicio"</b>.</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstallHelpModal(false)}
              className="w-full bg-black text-[#FACC15] font-black py-3 rounded-2xl hover:bg-gray-800 transition-all text-xs uppercase tracking-wider cursor-pointer shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

