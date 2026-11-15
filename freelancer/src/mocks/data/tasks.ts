import { Task, TaskSummary } from "../../services/workspace/types";
import { EscrowPayment } from "../../services/payment/types";

const now = Date.now();
const threeDays = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
const fiveDays = new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();

export const MOCK_TASKS: Record<string, Task> = {
  t1: {
    id: "t1",
    title: "Fix duplicate payment webhook retries",
    projectTitle: "Payments webhook retries",
    status: "in_progress",
    reward: 4500,
    dueAt: threeDays,
    ownerName: "Meera Shah",
    stack: ["Python", "FastAPI", "PostgreSQL"],
    repo: {
      name: "acme/payments-api",
      branch: "main",
      commit: "a1b2c3d",
    },
    brief: [
      "The payment gateway provider delivers webhook events with at-least-once semantics. When network jitter or upstream timeouts occur, the provider aggressively retries the same webhook delivery.",
      "Currently, the incoming webhook endpoint processes every single delivery without checking for previous executions. This causes duplicate ledger transactions and double-charges customers on delayed network acknowledgements.",
      "Additionally, webhook calls with forged or invalid HMAC signatures currently trigger an unhandled exception yielding an HTTP 500 status code. The payment gateway interprets 5xx errors as temporary failures and continues retrying. The endpoint must validate signatures immediately, reject invalid requests with HTTP 400 Bad Request, and record processed event IDs in an idempotent store.",
    ],
    criteria: [
      {
        id: "C1",
        text: "Duplicate webhook events are processed only once",
        testIds: ["test_webhook_idempotent_duplicate_event"],
        required: true,
      },
      {
        id: "C2",
        text: "Retries use exponential backoff and stop after 5 attempts",
        testIds: ["test_retry_backoff_schedule", "test_retry_stops_after_max_attempts"],
        required: true,
      },
      {
        id: "C3",
        text: "An invalid signature returns 400 and is not retried",
        testIds: ["test_invalid_signature_not_retried"],
        required: true,
      },
      {
        id: "C4",
        text: "The payment state machine still works",
        testIds: [
          "test_state_machine_authorized_to_held",
          "test_state_machine_release_requires_approval",
        ],
        required: true,
      },
      {
        id: "C5",
        text: "README documents idempotency",
        testIds: ["test_readme_documents_idempotency"],
        required: false,
      },
    ],
    history: [
      {
        at: new Date(now - 3600 * 1000 * 4).toISOString(),
        type: "task.assigned",
        text: "Task assigned to Ravi Freelancer by Meera Shah",
      },
      {
        at: new Date(now - 3600 * 1000 * 3).toISOString(),
        type: "workspace.created",
        text: "Isolated Docker sandbox provisioned with snapshot a1b2c3d",
      },
      {
        at: new Date(now - 3600 * 1000 * 2).toISOString(),
        type: "escrow.held",
        text: "Escrow funds locked: ₹4,500 held in CodeBridge Escrow Vault",
      },
    ],
  },

  t2: {
    id: "t2",
    title: "Add CSV export to the reports page",
    projectTitle: "Reporting Suite",
    status: "in_review",
    reward: 3200,
    dueAt: fiveDays,
    ownerName: "Devon Vance",
    stack: ["TypeScript", "React", "Tailwind CSS"],
    repo: {
      name: "acme/reports-ui",
      branch: "main",
      commit: "f4e5d6c",
    },
    brief: [
      "The finance team needs downloadable CSV reports of all quarterly ledger transactions directly from the summary view.",
      "The client-side export must handle up to 25,000 rows without freezing the main thread, formatting timestamps to ISO 8601 and numbers with standard commas.",
    ],
    criteria: [
      {
        id: "C1",
        text: "CSV download button streams data without blocking UI",
        testIds: ["test_csv_streaming_render"],
        required: true,
      },
      {
        id: "C2",
        text: "Output headers match standard finance taxonomy",
        testIds: ["test_csv_column_headers"],
        required: true,
      },
      {
        id: "C3",
        text: "Null or empty values are exported as empty quotes",
        testIds: ["test_csv_null_handling"],
        required: true,
      },
    ],
    history: [
      {
        at: new Date(now - 3600 * 1000 * 24 * 2).toISOString(),
        type: "task.assigned",
        text: "Task assigned to Ravi Freelancer",
      },
      {
        at: new Date(now - 3600 * 1000 * 12).toISOString(),
        type: "submission.created",
        text: "Solution submitted for code review",
      },
    ],
  },

  t3: {
    id: "t3",
    title: "Fix flaky CI tests",
    projectTitle: "Core Infrastructure",
    status: "completed",
    reward: 2000,
    dueAt: yesterday,
    ownerName: "Sarah Connor",
    stack: ["Go", "Docker", "GitHub Actions"],
    repo: {
      name: "acme/infra",
      branch: "main",
      commit: "987654a",
    },
    brief: [
      "Continuous integration runs intermittent race conditions when booting Postgres and Redis concurrently in integration stages.",
      "Implement deterministic health check retries and health-wait loops before test suites run.",
    ],
    criteria: [
      {
        id: "C1",
        text: "Docker compose health checks await readiness",
        testIds: ["test_ci_healthcheck_gate"],
        required: true,
      },
      {
        id: "C2",
        text: "Zero test failures across 50 consecutive runs",
        testIds: ["test_ci_flakiness_zero"],
        required: true,
      },
      {
        id: "C3",
        text: "CI run time remains under 3 minutes",
        testIds: ["test_ci_execution_time"],
        required: false,
      },
    ],
    history: [
      {
        at: new Date(now - 3600 * 1000 * 48).toISOString(),
        type: "task.assigned",
        text: "Task assigned to Ravi Freelancer",
      },
      {
        at: new Date(now - 3600 * 1000 * 24).toISOString(),
        type: "payment.released",
        text: "Escrow funds released: ₹2,000 paid to Ravi Freelancer",
      },
    ],
  },
};

MOCK_TASKS["task-1"] = { ...MOCK_TASKS.t1, id: "task-1" };
MOCK_TASKS["task-2"] = { ...MOCK_TASKS.t2, id: "task-2" };
MOCK_TASKS["task-3"] = { ...MOCK_TASKS.t3, id: "task-3" };

export const MOCK_TASK_SUMMARIES: TaskSummary[] = [
  MOCK_TASKS["task-1"],
  MOCK_TASKS["task-2"],
  MOCK_TASKS["task-3"],
].map((t) => ({
  id: t.id,
  title: t.title,
  projectTitle: t.projectTitle,
  status: t.status,
  reward: t.reward,
  dueAt: t.dueAt,
}));

export const MOCK_ESCROWS: Record<string, EscrowPayment> = {
  t1: {
    state: "held",
    amount: 4500,
    currency: "INR",
  },
  t2: {
    state: "tested",
    amount: 3200,
    currency: "INR",
  },
  t3: {
    state: "released",
    amount: 2000,
    currency: "INR",
  },
  "task-1": {
    state: "held",
    amount: 4500,
    currency: "INR",
  },
  "task-2": {
    state: "tested",
    amount: 3200,
    currency: "INR",
  },
  "task-3": {
    state: "released",
    amount: 2000,
    currency: "INR",
  },
};

