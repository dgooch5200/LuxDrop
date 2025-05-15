// src/global.d.ts
export {}; // this file needs to be a module for TS to merge the globals below

// if you have custom message payloads, put them here
interface MyMessageType {
    text: string;
    value: number;
}

declare global {
    interface Window {
        ipcRenderer: {
            /** Send a string or number to the main process */
            send(channel: string, data: string | number): void;

            /** Listen for replies (typed as any, or you can use overloaded signatures) */
            receive(
                channel: string,
                callback: (message: string | number | MyMessageType) => void
            ): void;

            /** Invoke a handler in the main process */
            invoke(channel: string, data: string | number): Promise<any>;

            /** Lower-level wrappers, if you exposed them */
            on(channel: string, listener: (...args: any[]) => void): void;
            off(channel: string, listener?: (...args: any[]) => void): void;
            removeAllListeners(channel: string): void;
        };
    }
}
