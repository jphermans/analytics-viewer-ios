import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.mount('#app')

// Listen for file open from native side
declare global {
  interface Window {
    handleFileFromNative?: (base64Content: string, fileName: string) => void;
    Capacitor?: any;
  }
}

// Handle URL scheme file opening
if (window.Capacitor) {
  import('@capacitor/app').then(({ App: CapApp }) => {
    CapApp.addListener('appUrlOpen', (data: any) => {
      if (data.url) {
        const event = new CustomEvent('capacitor-file-open', { detail: data.url });
        window.dispatchEvent(event);
      }
    });
  });
}
