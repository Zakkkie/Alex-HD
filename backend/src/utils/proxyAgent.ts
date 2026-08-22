import { ProxyAgent, setGlobalDispatcher } from 'undici';
import { fileLogger } from '../logger/fileLogger';

let activeProxyUrl: string | null = null;

export function initProxySupport(): void {
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    process.env.PROXY_URL ||
    process.env.SOCKS_PROXY ||
    null;

  if (proxyUrl) {
    try {
      activeProxyUrl = proxyUrl.trim();
      const dispatcher = new ProxyAgent(activeProxyUrl);
      setGlobalDispatcher(dispatcher);
      console.log(`[Proxy] Global HTTP/HTTPS proxy dispatcher configured: ${activeProxyUrl.replace(/:\/\/.*@/, '://***:***@')}`);
      fileLogger.info('Proxy', 'PROXY_CONFIGURED', `Глобальный HTTP/HTTPS прокси активирован: ${activeProxyUrl.replace(/:\/\/.*@/, '://***:***@')}`);
    } catch (err: any) {
      console.error('[Proxy] Failed to configure proxy agent:', err.message);
      fileLogger.warn('Proxy', 'PROXY_INIT_ERROR', `Ошибка инициализации прокси: ${err.message}`);
    }
  }
}

export function setCustomProxy(url: string | null): boolean {
  try {
    if (!url || !url.trim()) {
      activeProxyUrl = null;
      return true;
    }
    activeProxyUrl = url.trim();
    const dispatcher = new ProxyAgent(activeProxyUrl);
    setGlobalDispatcher(dispatcher);
    fileLogger.info('Proxy', 'PROXY_UPDATED', `Прокси обновлен: ${activeProxyUrl}`);
    return true;
  } catch (e: any) {
    fileLogger.warn('Proxy', 'PROXY_UPDATE_ERROR', `Ошибка обновления прокси: ${e.message}`);
    return false;
  }
}

export function getActiveProxy(): string | null {
  return activeProxyUrl;
}
