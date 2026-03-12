import { createWorker } from "tesseract.js";
import type { Worker } from "tesseract.js";

// TODO: USE TESSERACT BUILT IN SCHEDULERS

const POOL_SIZE = process.env.TESSERACT_POOL_SIZE
  ? parseInt(process.env.TESSERACT_POOL_SIZE, 10)
  : 2;
const workers: Worker[] = [];
let isInit = false;

const initWorkers = async () => {
  if (isInit) return;
  for (let i = 0; i < POOL_SIZE; i++) {
    const worker = await createWorker("eng");
    workers.push(worker);
  }
  isInit = true;
};

const getWorker = (): Worker => {
  const worker: Worker = workers.shift()!;
  workers.push(worker);
  return worker;
};

const extractText = async (image: Buffer): Promise<string> => {
  await initWorkers();
  const worker = getWorker();

  const {
    data: { text },
  } = await worker.recognize(image);

  return text;
};

// TODO: very messy, tidy it up

const hinglishWorkers: Worker[] = [];
let isHinglishInit = false;

const initHinglishWorker = async () => {
  const worker = await createWorker(["eng", "hin"]);
  for (let i = 0; i < POOL_SIZE; i++) {
    hinglishWorkers.push(worker);
  }
  isHinglishInit = true;
};

const getHinglishWorker = (): Worker => {
  const worker: Worker = hinglishWorkers.shift()!;
  hinglishWorkers.push(worker);
  return worker;
};

const extractHinglishText = async (file: Buffer): Promise<string> =>{
  await initHinglishWorker();
  const worker = getHinglishWorker();
    const {
    data: { text },
  } = await worker.recognize(file);

  return text;

}

export { extractText, extractHinglishText };

