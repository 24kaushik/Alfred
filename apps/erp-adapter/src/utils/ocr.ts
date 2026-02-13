import { createWorker } from "tesseract.js";
import type { Worker } from "tesseract.js";

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

export { extractText };

// (async () => {
//   const enhanced = await enhanceImage(arr);
//   const worker = await createWorker('eng');
//   const { data: { text } } = await worker.recognize(enhanced);
//   console.log(text);
// })();
