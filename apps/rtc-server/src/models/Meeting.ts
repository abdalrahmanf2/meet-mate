import type { Router } from "mediasoup/node/lib/RouterTypes.js";
import Client from "./Client.ts";
import type { RouterAppData } from "../types/media-types.ts";
import type { Socket } from "socket.io";
import type {
  DtlsParameters,
  TransportOptions,
} from "mediasoup-client/lib/types.js";

class Meeting {
  private router: Router<RouterAppData>;
  private clients: Client[];

  constructor(router: Router<RouterAppData>) {
    this.router = router;
    this.clients = [];
  }

  addClient(socket: Socket) {
    const client = new Client(this.router);

    // Setup the tranports
    socket.on(
      "meeting:create-transport",
      async ({ type }, ack: (payload?: TransportOptions) => void) => {
        const transportOptions = await client.createTrans(type);
        if (transportOptions) {
          ack(transportOptions);
        }

        ack();
      }
    );

    socket.on(
      "meeting:connect-trans",
      async (
        {
          dtlsParameters,
          type,
        }: { dtlsParameters: DtlsParameters; type: "send" | "recieve" },
        ack: (sucess: boolean) => void
      ) => {
        // returns true if the connect with a success
        ack(await client.connectTrans(dtlsParameters, type));
      }
    );

    this.clients.push(client);
  }
}

export default Meeting;
