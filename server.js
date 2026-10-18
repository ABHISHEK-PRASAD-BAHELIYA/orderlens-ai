
import express from "express";
import { createClient } from "redis";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GRAPH_NAME = process.env.FALKORDB_GRAPH || "orderlens";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const redis = createClient({
  url: process.env.FALKORDB_URL || "redis://localhost:6379",
});

redis.on("error", (error) => {
  console.error("FalkorDB connection error:", error.message);
});

// Convert FalkorDB's query response into readable JSON.
export function formatGraphResult(result) {
  if (!Array.isArray(result) || result.length < 2) {
    return { columns: [], rows: [] };
  }

  const headers = Array.isArray(result[0]) ? result[0] : [];
  const records = Array.isArray(result[1]) ? result[1] : [];

  const columns = headers.map((header) =>
    Array.isArray(header) ? header[header.length - 1] : String(header)
  );

  const rows = records.map((record) => {
    const values = Array.isArray(record) ? record : [record];

    return Object.fromEntries(
      columns.map((column, index) => [column, values[index] ?? null])
    );
  });

  return { columns, rows };
}

// Check whether the backend can reach FalkorDB.
app.get("/api/health", async (req, res) => {
  try {
    await redis.ping();

    res.json({
      status: "ok",
      service: "OrderLens AI",
      database: "FalkorDB connected",
      graph: GRAPH_NAME,
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Cannot connect to FalkorDB",
      detail: error.message,
    });
  }
});

// List demo orders with their connected incident for discovery in the dashboard.
app.get("/api/orders", async (req, res) => {
  const query = `
    MATCH (o:Order)-[:HAS_EVENT]->(e:TransactionEvent)-[:INVOKES]->(api:API)
          -[:DEPENDS_ON]->(s:Service)<-[:AFFECTS]-(i:Incident)
    RETURN o.id AS orderId, o.status AS status, i.id AS incidentId,
           i.description AS incident, i.severity AS severity, s.name AS service
    ORDER BY o.id
  `;
  try {
    const result = await redis.sendCommand(["GRAPH.QUERY", GRAPH_NAME, query]);
    res.json({ orders: formatGraphResult(result).rows });
  } catch (error) {
    res.status(503).json({ error: "Could not load graph orders", detail: error.message });
  }
});

// Investigate an order by traversing its connected graph.
app.get("/api/investigate/:orderId", async (req, res) => {
  const { orderId } = req.params;

  // Accept only safe order IDs for this initial MVP.
  if (!/^[A-Za-z0-9_-]+$/.test(orderId)) {
    return res.status(400).json({
      error: "Invalid order ID format",
    });
  }

  const query = `
    MATCH (o:Order {id: '${orderId}'})
          -[:HAS_EVENT]->(e:TransactionEvent)
          -[:INVOKES]->(api:API)
          -[:DEPENDS_ON]->(s:Service)
          <-[:AFFECTS]-(i:Incident)
          -[:SUGGESTS]->(r:Runbook),
          (t:Team)-[:OWNS]->(s)
    RETURN
      o.id AS orderId,
      o.status AS orderStatus,
      e.name AS recordedEvent,
      e.status AS eventStatus,
      api.name AS api,
      s.name AS service,
      i.id AS incidentId,
      i.description AS incident,
      i.severity AS severity,
      r.name AS recommendedRunbook,
      r.action AS recommendedAction,
      t.name AS responsibleTeam
  `;

  try {
    const result = await redis.sendCommand([
      "GRAPH.QUERY",
      GRAPH_NAME,
      query,
    ]);

    const investigation = formatGraphResult(result);

    if (investigation.rows.length === 0) {
      return res.status(404).json({
        error: "No matching investigation found",
        orderId,
        hint: "Check the order ID and graph relationships.",
      });
    }

    res.json({
      success: true,
      investigation,
      explanation:
        "The result was retrieved by traversing connected nodes in FalkorDB.",
    });
  } catch (error) {
    console.error("Investigation failed:", error.message);

    res.status(500).json({
      error: "Investigation query failed",
      detail: error.message,
    });
  }
});

async function startServer() {
  try {
    await redis.connect();

    // Seed the demo graph on first run. seed.cypher uses MERGE, so this is safe on restarts.
    const seed = await fs.readFile(path.join(__dirname, "database", "seed.cypher"), "utf8");
    await redis.sendCommand(["GRAPH.QUERY", GRAPH_NAME, seed]);

    app.listen(PORT, () => {
      console.log(`OrderLens AI running at http://localhost:${PORT}`);
      console.log(`Using FalkorDB graph: ${GRAPH_NAME}`);
    });
  } catch (error) {
    console.error("Could not start OrderLens AI:", error.message);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer();
}
