export interface RepoFileSnapshot {
  path: string;
  language: string;
  content: string;
}

export const T1_INITIAL_REPO: Record<string, RepoFileSnapshot> = {
  "README.md": {
    path: "README.md",
    language: "markdown",
    content: `# Payments API

Microservice handling incoming webhook deliveries from our payment processing partner.

## Setup
\`\`\`bash
pip install -r requirements.txt
uvicorn app.main:app --port 8000
\`\`\`

## Architecture
- \`app/webhooks.py\`: Inbound HMAC verification and event dispatcher.
- \`app/retry.py\`: Exponential backoff and retry scheduling.
- \`app/state_machine.py\`: Payment lifecycle management (authorized -> held -> released).
`,
  },

  "requirements.txt": {
    path: "requirements.txt",
    language: "plaintext",
    content: `fastapi==0.111.0
uvicorn==0.30.1
pydantic==2.7.4
pytest==8.2.2
httpx==0.27.0
psycopg2-binary==2.9.9
`,
  },

  "app/main.py": {
    path: "app/main.py",
    language: "python",
    content: `from fastapi import FastAPI, Request, Response
from app.webhooks import handle_webhook

app = FastAPI(title="Acme Payments Webhook Service")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/v1/webhooks/payment")
async def webhook_endpoint(request: Request):
    payload = await request.body()
    signature = request.headers.get("X-Signature", "")
    return await handle_webhook(payload, signature)
`,
  },

  "app/webhooks.py": {
    path: "app/webhooks.py",
    language: "python",
    content: `import hmac
import hashlib
import json
from fastapi import HTTPException

SECRET = b"whsec_production_demo_key_987654"

def verify_signature(payload: bytes, signature: str) -> bool:
    expected = hmac.new(SECRET, payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

async def handle_webhook(payload: bytes, signature: str):
    if not verify_signature(payload, signature):
        # BUG: raises 500 instead of 400, causing endless retry loops!
        raise HTTPException(status_code=500, detail="Invalid HMAC signature")

    data = json.loads(payload.decode("utf-8"))
    event_id = data.get("id")

    # BUG: No de-duplication store check!
    # Every delivery creates another transaction charge!
    record_payment_charge(data)

    return {"status": "processed", "eventId": event_id}

def record_payment_charge(event_data: dict):
    print(f"Charge recorded for event: {event_data.get('id')}")
`,
  },

  "app/retry.py": {
    path: "app/retry.py",
    language: "python",
    content: `import time

# BUG: constant delay and infinite retry loops
def calculate_retry_delay(attempt: number) -> int:
    delay = 1
    return delay

def should_retry(attempt: int) -> bool:
    # BUG: No max attempts limit
    return True

def schedule_retry(event_id: str, attempt: int):
    if should_retry(attempt):
        delay = calculate_retry_delay(attempt)
        time.sleep(delay)
        return True
    return False
`,
  },

  "app/state_machine.py": {
    path: "app/state_machine.py",
    language: "python",
    content: `from enum import Enum

class PaymentState(str, Enum):
    AUTHORIZED = "authorized"
    HELD = "held"
    TESTED = "tested"
    APPROVED = "approved"
    RELEASED = "released"

class PaymentStateMachine:
    def __init__(self, initial_state=PaymentState.AUTHORIZED):
        self.state = initial_state

    def hold(self):
        if self.state != PaymentState.AUTHORIZED:
            raise ValueError(f"Cannot hold payment from {self.state}")
        self.state = PaymentState.HELD
        return self.state

    def release(self, is_approved: bool = False):
        if not is_approved:
            raise PermissionError("Release requires verified approval")
        self.state = PaymentState.RELEASED
        return self.state
`,
  },

  "tests/test_webhooks.py": {
    path: "tests/test_webhooks.py",
    language: "python",
    content: `import pytest
from app.webhooks import handle_webhook

@pytest.mark.asyncio
async def test_duplicate_webhook_deduplicated():
    pass
`,
  },

  "tests/test_retry.py": {
    path: "tests/test_retry.py",
    language: "python",
    content: `from app.retry import calculate_retry_delay, should_retry

def test_exponential_backoff():
    pass
`,
  },

  "tests/test_state_machine.py": {
    path: "tests/test_state_machine.py",
    language: "python",
    content: `from app.state_machine import PaymentStateMachine

def test_transitions():
    sm = PaymentStateMachine()
    assert sm.hold() == "held"
`,
  },
};

export const REFERENCE_FIX = {
  "app/webhooks.py": `import hmac
import hashlib
import json
from fastapi import HTTPException

SECRET = b"whsec_production_demo_key_987654"

# Set of processed event IDs to ensure idempotent handling
processed_event_ids = set()

def verify_signature(payload: bytes, signature: str) -> bool:
    expected = hmac.new(SECRET, payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

async def handle_webhook(payload: bytes, signature: str):
    if not verify_signature(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid HMAC signature")

    data = json.loads(payload.decode("utf-8"))
    event_id = data.get("id")

    if event_id in processed_event_ids:
        return {"status": "already_processed", "eventId": event_id}

    processed_event_ids.add(event_id)
    record_payment_charge(data)

    return {"status": "processed", "eventId": event_id}

def record_payment_charge(event_data: dict):
    print(f"Charge recorded for event: {event_data.get('id')}")
`,

  "app/retry.py": `MAX_ATTEMPTS = 5

def calculate_retry_delay(attempt: int) -> int:
    # Exponential backoff schedule: 1, 2, 4, 8, 16
    return 2 ** attempt

def should_retry(attempt: int) -> bool:
    return attempt < MAX_ATTEMPTS

def schedule_retry(event_id: str, attempt: int):
    if should_retry(attempt):
        delay = calculate_retry_delay(attempt)
        return {"scheduled": True, "delay": delay, "attempt": attempt}
    return {"scheduled": False, "reason": "Max attempts reached"}
`,

  "README.md": `# Payments API

Microservice handling incoming webhook deliveries from our payment processing partner.

## Idempotency and Webhook Handling
Incoming deliveries feature strict idempotency controls. Duplicate deliveries with the same event ID are discarded without extra charges. Invalid signatures return HTTP 400 Bad Request to halt unnecessary upstream retries.

## Architecture
- \`app/webhooks.py\`: Inbound HMAC verification and idempotent event store.
- \`app/retry.py\`: Exponential backoff schedule (2 ** attempt) capped at MAX_ATTEMPTS = 5.
- \`app/state_machine.py\`: State transitions (authorized -> held -> released).
`,
};

