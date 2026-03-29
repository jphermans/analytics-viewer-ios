import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.analyticsviewer.app',
  appName: 'Analytics Viewer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F2F2F7'
    }
  }
};

export default config;
