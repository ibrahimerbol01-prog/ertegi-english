// Daily per-user limits, counted atomically in Postgres (bump_api_usage).
// Fails closed: if the counter can't be read, the request is refused, so a
// database hiccup never turns into unlimited calls to a paid service.

// Until the 20261103 migration is applied the function does not exist yet;
// then the old two-step count (read, then write) keeps the app working.
const MISSING = new Set(["PGRST202", "42883"]);
// Before the migration lesson feedback shared the chat counter, as it always had.
const LEGACY_COLUMN = { chat: "shoqan_count", tool: "shoqan_count" };

async function legacyBump(admin, userId, kind, limit) {
  const column = LEGACY_COLUMN[kind];
  if (!column) return { ok: true }; // no old counter for this bucket
  const today = new Date().toISOString().slice(0, 10);
  const { data: row, error } = await admin
    .from("api_usage_daily").select(column).eq("user_id", userId).eq("date", today).maybeSingle();
  if (error) return { ok: false, status: 503 };
  const count = row?.[column] ?? 0;
  if (count >= limit) return { ok: false, status: 429 };
  const { error: writeError } = await admin
    .from("api_usage_daily")
    .upsert({ user_id: userId, date: today, [column]: count + 1 }, { onConflict: "user_id,date" });
  if (writeError) return { ok: false, status: 503 };
  return { ok: true };
}

/** Counts one request. Returns { ok: true } or { ok: false, status: 429 | 503 }. */
export async function takeQuota(admin, userId, kind, limit) {
  const { data, error } = await admin.rpc("bump_api_usage", { p_user: userId, p_kind: kind, p_limit: limit });
  if (error) {
    if (MISSING.has(error.code)) return legacyBump(admin, userId, kind, limit);
    console.error(`[usage] ${kind} counter failed:`, error.message);
    return { ok: false, status: 503 };
  }
  if (typeof data !== "number" || data < 0) return { ok: false, status: 429 };
  return { ok: true };
}

/** Gives one request back after the upstream service failed. Never throws. */
export async function refundQuota(admin, userId, kind) {
  try {
    const { error } = await admin.rpc("refund_api_usage", { p_user: userId, p_kind: kind });
    if (error && !MISSING.has(error.code)) console.error(`[usage] ${kind} refund failed:`, error.message);
  } catch (err) {
    console.error(`[usage] ${kind} refund failed:`, err);
  }
}
