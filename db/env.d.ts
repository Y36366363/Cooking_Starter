declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    SUBMISSION_NOTIFY_WEBHOOK?: string;
    SUBMISSION_NOTIFY_TO?: string;
  }
}
