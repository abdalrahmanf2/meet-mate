import type { AppData } from "mediasoup/node/lib/types.js";

export interface WorkerAppData extends AppData {
  load: number;
}

export interface RouterAppData extends AppData {
  clients: string[];
}
