import type { AppData } from "mediasoup/node/lib/types.js";

export interface ConsumerAppData extends AppData {
  userId: string;
}
