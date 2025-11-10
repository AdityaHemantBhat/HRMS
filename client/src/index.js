import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { store } from './store';
import App from './App';
import './styles/index.scss';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#6366f1',
              colorInfo: '#6366f1',
              colorSuccess: '#10b981',
              colorWarning: '#f59e0b',
              colorError: '#ef4444',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            },
            components: {
              Button: {
                controlHeight: 40,
                fontWeight: 600,
              },
              Input: {
                controlHeight: 40,
              },
              Select: {
                controlHeight: 40,
              },
            },
          }}
        >
          <AntApp 
            message={{ 
              top: 24, 
              duration: 3, 
              maxCount: 3 
            }}
            notification={{
              placement: 'topRight',
              top: 24,
              duration: 4.5,
              maxCount: 3
            }}
          >
            <App />
          </AntApp>
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// Register service worker for PWA (disabled for development)
// Uncomment in production if you want PWA features
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/service-worker.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }
