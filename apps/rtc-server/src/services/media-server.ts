import { createWorker } from "mediasoup";
import type { Worker } from "mediasoup/node/lib/types.js";
import os from "os";
import { workerConfig } from "../config/mediasoup.ts";
import type { WorkerAppData } from "../types/media-types.ts";

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
export const getLeastLoadedWorker = () => {
  let leastLoadedWorker = workers[0];

  for (const worker of workers) {
    if (worker.appData.load < leastLoadedWorker.appData.load) {
      leastLoadedWorker = worker;
    }
  }

  return leastLoadedWorker;
};
