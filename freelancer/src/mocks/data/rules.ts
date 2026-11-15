export interface TestRule {
  testId: string;
  file: string;
  required: boolean;
  ruleType: "contains" | "regex" | "custom";
  needle: string;
  failMessage: string;
  order: number;
}

export const TEST_RULES: TestRule[] = [
  {
    testId: "test_webhook_idempotent_duplicate_event",
    file: "app/webhooks.py",
    required: true,
    ruleType: "contains",
    needle: "processed_event_ids",
    failMessage: "AssertionError: expected 1 charge, got 2 (duplicate event processed twice)",
    order: 1,
  },
  {
    testId: "test_invalid_signature_not_retried",
    file: "app/webhooks.py",
    required: true,
    ruleType: "contains",
    needle: "status_code=400",
    failMessage: "AssertionError: expected 400, got 500 (the provider will keep retrying)",
    order: 2,
  },
  {
    testId: "test_retry_backoff_schedule",
    file: "app/retry.py",
    required: true,
    ruleType: "contains",
    needle: "2 ** attempt",
    failMessage: "AssertionError: expected [1, 2, 4, 8, 16], got [1, 1, 1, 1, 1]",
    order: 3,
  },
  {
    testId: "test_retry_stops_after_max_attempts",
    file: "app/retry.py",
    required: true,
    ruleType: "contains",
    needle: "MAX_ATTEMPTS = 5",
    failMessage: "AssertionError: retry scheduled for attempt 6 (limit is 5)",
    order: 4,
  },
  {
    testId: "test_state_machine_authorized_to_held",
    file: "app/state_machine.py",
    required: true,
    ruleType: "contains",
    needle: "def hold",
    failMessage: "AssertionError: missing hold state transition",
    order: 5,
  },
  {
    testId: "test_state_machine_release_requires_approval",
    file: "app/state_machine.py",
    required: true,
    ruleType: "contains",
    needle: "def release",
    failMessage: "AssertionError: release action does not enforce approval",
    order: 6,
  },
  {
    testId: "test_readme_documents_idempotency",
    file: "README.md",
    required: false,
    ruleType: "regex",
    needle: "idempotent",
    failMessage: "AssertionError: README does not mention idempotency",
    order: 7,
  },
];

