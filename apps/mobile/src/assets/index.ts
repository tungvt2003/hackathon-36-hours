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
    restaurantDefault: safeRequire(() => require('../../assets/images/restaurant-default.jpg')),
    mapPlaceholder: safeRequire(() => require('../../assets/images/map-placeholder.png')),
    grabLogo: safeRequire(() => require('../../assets/images/grab-logo.png')),
    bgTexture: safeRequire(() => require('../../assets/images/bg-texture.png')),
    suaraLogo: safeRequire(() => require('../../assets/images/Suara.png')),
  },
  sounds: {
    success: safeRequire(() => require('../../assets/sounds/alert.mp3'))
  },
} as const;
