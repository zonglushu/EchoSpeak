import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './components/AuthProvider';
import AppAuth from './AppAuth';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { supabase } from './lib/supabase';
import { initP0Features } from '@echospeak/services';
import './index.css';
import '@echospeak/ui/theme.css';
import './i18n';

// Initialize P0 Features with Supabase client
initP0Features(supabase);

// Register Service Worker (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        type: 'module'
      });
      console.log('SW registered: ', registration);

      // 监听 Service Worker 更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 有新版本可用，提示用户刷新
              console.log('New version available. Please refresh the page.');
              // 可以添加自定义 UI 提示用户刷新
              if (confirm('发现新版本，是否立即更新？')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('SW registration failed: ', error);
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <OfflineIndicator />
    <AuthProvider>
      <AppAuth />
      <PWAInstallPrompt />
    </AuthProvider>
  </React.StrictMode>
);
