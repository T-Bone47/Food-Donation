import crypto from "node:crypto";

/**
 * FoodShare Authoritative Real-Time Event Bus & SSE Hub
 * 
 * Manages active Server-Sent Events (SSE) connections across all 4 platform roles
 * (Donor, Volunteer, NGO, Admin) in both Production and Demo Mode environments.
 * 
 * Guarantees:
 * 1. Strict Tenant Isolation (Demo events never leak to Production; Production events never leak to Demo).
 * 2. Role-Based Event Filtering and Delivery.
 * 3. Connection Keep-Alive with automatic ping heartbeats.
 * 4. Graceful client reconnection and cleanup.
 */

// Active SSE client connections
const clients = new Set();

let eventsEmittedCount = 0;
const serviceStartTime = Date.now();

/**
 * Register a newly connected SSE client response stream.
 */
export function registerClient(userId, role, isDemo, res) {
  const clientId = crypto.randomUUID();

  // Set SSE response headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
  });

  // Flush initial connection confirmation
  res.write(`: connected clientId=${clientId} timestamp=${new Date().toISOString()}\n\n`);

  const client = {
    id: clientId,
    userId,
    role,
    isDemo: Boolean(isDemo),
    res,
    connectedAt: new Date(),
  };

  clients.add(client);

  // Send initial synchronization handshake event
  const syncPayload = JSON.stringify({
    type: "system.sync",
    status: "connected",
    clientId,
    userId,
    role,
    isDemo: Boolean(isDemo),
    timestamp: new Date().toISOString(),
  });
  res.write(`data: ${syncPayload}\n\n`);

  // Periodic heartbeat ping to keep connection alive through proxies
  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(pingInterval);
      clients.delete(client);
    }
  }, 20000);

  // Clean up on disconnect
  const cleanup = () => {
    clearInterval(pingInterval);
    clients.delete(client);
  };

  res.on("close", cleanup);
  res.on("finish", cleanup);
  res.on("error", cleanup);

  return clientId;
}

/**
 * Canonical real-time event broadcast dispatcher.
 */
export function broadcastRealtimeEvent(eventType, payload, options = {}) {
  eventsEmittedCount++;

  const isDemo = Boolean(options.isDemo);
  const event = {
    id: crypto.randomUUID(),
    type: eventType,
    entity: options.entity || "donation",
    entityId: options.entityId || payload?.id || payload?.donation?.id || null,
    actorId: options.actorId || null,
    isDemo,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  const message = `data: ${JSON.stringify(event)}\n\n`;

  for (const client of clients) {
    try {
      // 1. Strict Tenant Isolation
      if (client.isDemo !== isDemo) {
        continue;
      }

      // 2. Direct Notification Routing
      if (eventType === "notification.created") {
        const recipientId = payload?.recipient_id;
        if (recipientId && client.userId !== recipientId && client.role !== "Admin") {
          continue;
        }
      }

      // 3. Write event to authorized client
      client.res.write(message);
    } catch (err) {
      clients.delete(client);
    }
  }

  return event;
}

/**
 * Diagnostics & operational telemetry for real-time streaming status.
 */
export function getRealtimeDiagnostics() {
  let demoCount = 0;
  let prodCount = 0;
  const roleBreakdown = { Donor: 0, Volunteer: 0, NGO: 0, Admin: 0 };

  for (const c of clients) {
    if (c.isDemo) demoCount++;
    else prodCount++;
    if (c.role && roleBreakdown[c.role] !== undefined) {
      roleBreakdown[c.role]++;
    }
  }

  return {
    status: "healthy",
    totalConnectedClients: clients.size,
    demoClients: demoCount,
    productionClients: prodCount,
    roleBreakdown,
    eventsEmittedCount,
    uptimeSeconds: Math.floor((Date.now() - serviceStartTime) / 1000),
  };
}
