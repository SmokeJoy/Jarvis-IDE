import { createRoot } from 'react-dom/client';
import { Webview } from './webview';
import { ApiConfiguration } from '../types/global';

declare global {
  interface Window {
    initialConfig: ApiConfiguration;
  }
}

const root = createRoot(document.getElementById('root')!);
root.render(<Webview config={window.initialConfig} />);
