import { createApp } from "./app.js";
import { getConfig } from "./config/env.js";
import { processExpiredDonations } from "./services/donation.service.js";

const config = getConfig();
const app = createApp();

const PORT = config.port;

async function sweepExpiredDonations() {
  try {
    const result = await processExpiredDonations();
    if (result.processed > 0) {
      console.log(`[EXPIRY] Marked ${result.processed} donation(s) as EXPIRED`);
    }
  } catch (err) {
    console.error("[EXPIRY] Sweep failed:", err.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.env}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);

  // Expiry must actually run automatically. The admin endpoint remains for
  // manual operation, but the server now sweeps on a fixed interval.
  if (process.env.EXPIRY_SWEEPER !== "false") {
    const timer = setInterval(
      sweepExpiredDonations,
      config.expirySweepIntervalMs
    );
    timer.unref?.();
    setTimeout(sweepExpiredDonations, 5_000).unref?.();
  }
});