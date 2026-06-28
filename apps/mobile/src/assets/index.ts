export function safeRequire(fn: () => any): any {
  try {
    return fn();
  } catch {
    return null;
  }
}

export const ASSETS = {
  images: {
    phoBoTai: safeRequire(() => require('../../assets/images/pho-bo-tai.jpg')),
    phoGa: safeRequire(() => require('../../assets/images/pho-ga.jpg')),
    restaurantDefault: safeRequire(() => require('../../assets/images/restaurant-default.png')),
    mapPlaceholder: safeRequire(() => require('../../assets/images/map-placeholder.jpg')),
    grabLogo: safeRequire(() => require('../../assets/images/grab-logo.jpg')),
    bgTexture: safeRequire(() => require('../../assets/images/bg-texture.jpg')),
    suaraLogo: safeRequire(() => require('../../assets/images/Suara.png')),
  },
  sounds: {
    success: safeRequire(() => require('../../assets/sounds/alert.mp3'))
  },
} as const;
