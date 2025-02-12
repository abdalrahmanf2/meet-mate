import { Consumer, Producer } from "mediasoup-client/lib/types";
import { ConsumerAppData } from "types/media-soup";

export interface Client {
  audio?: Consumer<ConsumerAppData>;
  video?: Consumer<ConsumerAppData>;
}
