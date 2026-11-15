import { AiContext } from "../../services/ai/types";

export const MOCK_AI_CONTEXTS: Record<string, AiContext> = {
  t1: {
    summary:
      "The webhook ingestion service fails to de-duplicate incoming requests, leading to multiple ledger debits during partner network retries (simulated). Furthermore, signature verification errors trigger HTTP 500 internal server responses rather than HTTP 400 client rejections, perpetuating upstream retry storms (simulated). The backoff calculation in app/retry.py is also hardcoded to a static 1-second delay without an iteration bound (simulated).",
    findings: [
      "Missing idempotent event cache: app/webhooks.py executes record_payment_charge without verifying prior event IDs (simulated).",
      "Unhandled exception on invalid HMAC signature raises an HTTP 500 instead of HTTP 400 Bad Request, violating the partner webhook contract (simulated).",
      "Retry scheduler lacks exponential backoff and does not terminate after the mandated 5 attempts (simulated).",
    ],
    relevantFiles: [
      {
        path: "app/webhooks.py",
        score: 0.94,
        reason: "Handler has no de-duplication and answers a bad signature with 500",
      },
      {
        path: "app/retry.py",
        score: 0.88,
        reason: "Constant delay and no attempt limit",
      },
      {
        path: "app/state_machine.py",
        score: 0.52,
        reason: "Transitions must stay intact",
      },
      {
        path: "tests/test_webhooks.py",
        score: 0.47,
        reason: "Integration test coverage for duplicate webhook deliveries",
      },
      {
        path: "tests/test_retry.py",
        score: 0.41,
        reason: "Unit tests verifying exponential backoff sequence",
      },
    ],
    approach: [
      "1. Add an in-memory set or Redis-compatible store `processed_event_ids` in `app/webhooks.py` to discard already processed event IDs with a 200/already_processed status (simulated).",
      "2. Change the HTTPException in `app/webhooks.py` for signature mismatch from 500 to 400 (simulated).",
      "3. In `app/retry.py`, implement exponential delay `2 ** attempt` and enforce `MAX_ATTEMPTS = 5` in `should_retry` (simulated).",
      "4. Verify `app/state_machine.py` retains `def hold` and `def release` with approval checks intact (simulated).",
      "5. Update `README.md` to document the idempotency guarantees and verify with the test suite (simulated).",
    ],
  },
};

