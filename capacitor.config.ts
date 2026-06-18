import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tranthienhau.gildedoctave',
  appName: 'The Gilded Octave',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    backgroundColor: '#160608',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#160608',
      showSpinner: false,
    },
  },
};

export default config;
