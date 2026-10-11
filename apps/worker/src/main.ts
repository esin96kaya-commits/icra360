import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const queueName = "health";

const queue = new Queue(queueName, { connection });

const worker = new Worker(
  queueName,
  async (job) => {
    return { ok: true, jobId: job.id, at: new Date().toISOString() };
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(JSON.stringify({ msg: "job_completed", queue: queueName, jobId: job.id }));
});

worker.on("failed", (job, error) => {
  console.error(JSON.stringify({ msg: "job_failed", queue: queueName, jobId: job?.id, err: error.message }));
});

async function main() {
  await queue.add(
    "heartbeat",
    {},
    {
      repeat: { every: 60_000 },
      jobId: "worker-heartbeat",
    },
  );
  console.log(JSON.stringify({ msg: "worker_started", queue: queueName }));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
