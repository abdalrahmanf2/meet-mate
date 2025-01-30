import { createWorker } from "mediasoup";
import type { Router, Worker } from "mediasoup/node/lib/types.js";
import os from "os";
import { routerConfig, workerConfig } from "../config/mediasoup.ts";
import { meetingHandler, meetings } from "../sockets/meeting.ts";
import type { RouterAppData, WorkerAppData } from "../types/media-types.ts";

export const workers: Worker<WorkerAppData>[] = [];

/**
 * Creates Mediasoup Workers and Pushes them into a global array called workers.
 */
export const createMediaWorkers = async () => {
  // TODO: in deployment I'll remove the division by 2, this is just so I don't overwhelm my machine.
  const cpuCoresNum = os.cpus().length / 2;

  for (let i = 0; i < cpuCoresNum; i++) {
    const worker = await createWorker(workerConfig);
    workers.push(worker);
  }
};

/**
 * Gets the next worker that the next router AKA Conferencing Room should be created on.
 */
const getLeastLoadedWorker = () => {
  let leastLoadedWorker = workers[0];

  for (const worker of workers) {
    if (worker.appData.load < leastLoadedWorker.appData.load) {
      leastLoadedWorker = worker;
    }
  }

  return leastLoadedWorker;
};

export const getRouter = async (meetingId: string) => {
  // if there's a router already for this meeting return it
  if (meetings.has(meetingId)) {
    return meetings.get(meetingId)!;
  }

  // Create a router if it doesn't exist.
  const worker = getLeastLoadedWorker();
  const router = (await worker.createRouter(
    routerConfig
  )) as Router<RouterAppData>;

  worker.appData.load++;
  meetings.set(meetingId, { worker, router });

  return { router, worker };
};

export const destroyRouter = async (meetingId: string) => {
  const { worker, router } = meetings.get(meetingId)!;

  // Close the router and also dgetnt the load
  router.close();
  worker.appData.load--;

  // Remove meeting's info from the map
  meetings.delete(meetingId);
};
