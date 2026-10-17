import { createSandboxHtml } from './sandbox-document';
import {
  isSandboxOutboundMessage,
  type SandboxInboundMessage,
  type SandboxOutboundMessage,
} from '../execution.protocol';

export type SandboxEventHandler = (msg: SandboxOutboundMessage) => void;

export class SandboxManager {
  private iframe: HTMLIFrameElement | null = null;
  private isReady = false;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private eventHandlers: Set<SandboxEventHandler> = new Set();
  private readyResolvers: Array<() => void> = [];

  constructor() {
    this.messageListener = this.handleWindowMessage.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.messageListener);
    }
  }

  public async init(): Promise<void> {
    if (typeof document === 'undefined') return;

    if (this.iframe) {
      this.destroyIframe();
    }

    this.isReady = false;

    const iframe = document.createElement('iframe');
    iframe.title = 'JavaScript Execution Sandbox';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);
    this.iframe = iframe;

    // Inject sandbox document
    iframe.srcdoc = createSandboxHtml();

    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        // Fallback: mark ready if postMessage was delayed
        this.isReady = true;
        resolve();
      }, 1000);

      this.readyResolvers.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private handleWindowMessage(event: MessageEvent): void {
    if (!this.iframe || !this.iframe.contentWindow) return;
    if (event.source !== this.iframe.contentWindow) return;

    const data = event.data;
    if (!isSandboxOutboundMessage(data)) return;

    if (data.type === 'SANDBOX_READY') {
      this.isReady = true;
      const resolvers = [...this.readyResolvers];
      this.readyResolvers = [];
      resolvers.forEach((resolve) => resolve());
    }

    this.eventHandlers.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error('Error in sandbox event handler:', err);
      }
    });
  }

  public onMessage(handler: SandboxEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  public async execute(executionId: string, code: string): Promise<void> {
    if (!this.iframe || !this.isReady) {
      await this.init();
    }

    if (!this.iframe?.contentWindow) {
      throw new Error('Sandbox execution window is not available.');
    }

    const message: SandboxInboundMessage = {
      type: 'EXECUTE',
      executionId,
      code,
    };

    this.iframe.contentWindow.postMessage(message, '*');
  }

  private destroyIframe(): void {
    if (this.iframe) {
      try {
        this.iframe.srcdoc = 'about:blank';
        this.iframe.remove();
      } catch (e) {
        // ignore
      }
      this.iframe = null;
      this.isReady = false;
    }
  }

  public async terminateAndRecreate(): Promise<void> {
    this.destroyIframe();
    await this.init();
  }

  public destroy(): void {
    if (this.messageListener && typeof window !== 'undefined') {
      window.removeEventListener('message', this.messageListener);
    }
    this.destroyIframe();
    this.eventHandlers.clear();
    this.readyResolvers = [];
  }
}
