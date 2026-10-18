# OrderLens AI

**See the connections. Resolve the incident.** OrderLens AI helps commerce operations and support teams trace a stuck order through connected events, APIs, services, incidents, runbooks, and service owners.

Built for **Graph Hacks** with **FalkorDB, Node.js, Express, and Docker Compose**.

## The problem

Order problems are often investigated across disconnected records. A status such as `STUCK` does not explain which downstream dependency failed, whether a wider incident is involved, or which team should act. OrderLens models these facts and their relationships as a graph, then traverses the graph to produce an evidence-backed investigation.

## Demo scenarios

The app seeds three repeatable sample investigations:

| Order | Issue | Related incident | Suggested next step |
| --- | --- | --- | --- |
| `ORD-1042` | Seller status callback missing | `INC-201` · High | Inspect callback logs before retrying |
| `ORD-2088` | Payment authorization failed | `INC-315` · Critical | Check the processor response code before retrying payment |
| `ORD-3091` | Shipment pickup scan delayed | `INC-428` · Medium | Confirm the dispatch manifest and contact the carrier |

Each investigation also shows the API, affected service, recommended runbook, and team that owns the service. These are sample graph records, not live customer data.

## Features

- Responsive browser dashboard with FalkorDB connection status
- Demo case discovery with incident severity and service context
- Order lookup by ID, including clear not-found and database error messages
- Graph trace from order and event through API, service, incident, and runbook
- Explanation of why the incident matches the affected service
- Evidence-based recommended action and responsible service team
- Idempotent graph seeding on app startup, so restarts do not duplicate demo records
- Health and order-list API endpoints for the UI
- Docker Compose setup with separate app and database-console ports

Recommendations come from the connected graph records and linked runbooks. The MVP does not call an external generative AI service, operate on live commerce systems, or automatically retry or modify orders.

## Architecture

```text
Browser UI :3000
      │
      ▼
Express API :3000 ── Redis protocol ── FalkorDB :6379
      │                                      │
      └── /api/health                        └── orderlens graph
          /api/orders                            Order → Event → API → Service
          /api/investigate/:orderId              Incident → Runbook; Team → Service

FalkorDB browser console: http://localhost:3001
```

## Requirements

- Windows 10 or 11
- [Node.js LTS](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git, if publishing to GitHub

## Run locally on Windows

1. Extract this ZIP to a folder you can find, then open that folder in VS Code.
2. Start Docker Desktop and wait for it to finish starting.
3. In VS Code, open **Terminal → New Terminal** and run:

```powershell
docker compose up -d
npm install
npm test
npm start
```

The API seeds the demo graph when it starts. Keep the terminal open while presenting.

Open these URLs:

- **OrderLens dashboard:** [http://localhost:3000](http://localhost:3000)
- **FalkorDB graph console:** [http://localhost:3001](http://localhost:3001)
- **Health:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Demo orders:** [http://localhost:3000/api/orders](http://localhost:3000/api/orders)
- **Sample investigation:** [http://localhost:3000/api/investigate/ORD-1042](http://localhost:3000/api/investigate/ORD-1042)

Select a demo case or enter one of the order IDs above. The dashboard displays the graph path, related incident, runbook, recommended action, team owner, and match explanation.

## Configuration

The app uses defaults from `.env.example`. Copy it to `.env` only when changing configuration. `.env` is excluded from Git; never commit passwords, API keys, or private connection strings.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Dashboard and API port |
| `FALKORDB_URL` | `redis://localhost:6379` | FalkorDB connection URL |
| `FALKORDB_GRAPH` | `orderlens` | Graph name |

## API

- `GET /api/health` — check the database connection.
- `GET /api/orders` — list orders with connected incidents and services.
- `GET /api/investigate/:orderId` — traverse the graph for an order investigation.

Run `npm test` to check the graph response formatter.

## Troubleshooting

- **Docker command fails:** Start Docker Desktop, wait until it is running, then retry `docker compose up -d`.
- **Port 3000 is occupied:** Close the app using that port, or run `$env:PORT=3002; npm start` and open `http://localhost:3002`.
- **Database unavailable:** Run `docker compose ps`. If FalkorDB is stopped, run `docker compose up -d` and restart `npm start`.
- **No investigation found:** Check the ID or choose one of the three demo cards. The database is seeded automatically when the API starts.
- **Stop the database:** Run `docker compose down`. Data is kept in its Docker volume. To erase demo graph data too, run `docker compose down -v`.

## 90-second demo script

1. **Problem (10 seconds):** “A stuck order is only a symptom. The evidence is spread across events, APIs, services, and incident records.”
2. **Graph (20 seconds):** Open `ORD-1042` and trace Confirm event → Confirm API → SellerGateway → `INC-201`.
3. **Action (20 seconds):** Show the callback-delivery runbook, suggested log check, and Commerce Integrations as the service owner.
4. **Breadth (20 seconds):** Select `ORD-2088` to show a critical payment case, then `ORD-3091` to show a delayed shipment case.
5. **Close (20 seconds):** Explain that FalkorDB connects the operational clues and that the prototype returns the linked runbook and owner without claiming to change the order automatically.

## Hackathon submission checklist

- Run every demo case once before recording.
- Record a short screen demo that shows the dashboard, graph trace, and recommended action.
- Add your name, GitHub URL, demo-video URL, and hackathon submission URL to the official form.
- Explain what the graph connects and why the recommendation follows from those connections.
- Do not claim live integrations, measured time savings, or automatic remediation; this demo uses sample data.

## Publish to GitHub

Create a public repository named `orderlens-ai`. In a VS Code terminal opened in this project folder, run:

```powershell
git init
git add .
git status
```

Check that `.env` and `node_modules` are not listed. Then replace `YOUR-USERNAME` with your GitHub username and run:

```powershell
git commit -m "Build OrderLens AI graph incident detective"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/orderlens-ai.git
git push -u origin main
```

Do not upload `.env`, credentials, or `node_modules`.
"# orderlens-ai" 
