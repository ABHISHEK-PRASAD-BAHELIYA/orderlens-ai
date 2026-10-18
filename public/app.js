const form = document.querySelector("#search-form");
const input = document.querySelector("#order-id");
const button = document.querySelector("#search-button");
const message = document.querySelector("#message");
const results = document.querySelector("#results");
const orderList = document.querySelector("#order-list");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function showPath(row) {
  const nodes = [
    ["◫", row.orderId, `Order · ${row.orderStatus}`],
    ["↻", row.recordedEvent, `Event · ${row.eventStatus}`],
    ["⌘", row.api, "API"],
    ["◇", row.service, "Service"],
    ["!", row.incidentId, "Incident"],
    ["✓", row.recommendedRunbook, "Runbook"],
  ];
  document.querySelector("#graph-path").innerHTML = nodes.map((node, i) =>
    `${i ? '<span class="path-link"></span>' : ""}<div class="path-node"><span class="node-icon">${node[0]}</span><b>${escapeHtml(node[1])}</b><small>${escapeHtml(node[2])}</small></div>`
  ).join("");
}

async function loadOrders() {
  const count = document.querySelector("#order-count");
  try {
    const response = await fetch("/api/orders");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load demo orders");
    count.textContent = `${data.orders.length} connected investigations`;
    orderList.innerHTML = data.orders.map((order) => `
      <button class="order-card" type="button" data-order-id="${escapeHtml(order.orderId)}">
        <span class="order-card-top"><b>${escapeHtml(order.orderId)}</b><span class="mini-severity ${escapeHtml(String(order.severity).toLowerCase())}">${escapeHtml(order.severity)}</span></span>
        <span class="order-card-status">${escapeHtml(order.status)}</span>
        <span class="order-card-incident">${escapeHtml(order.incident)}</span>
        <span class="order-card-service">${escapeHtml(order.service)} <i>→</i></span>
      </button>`).join("");
  } catch (error) {
    count.textContent = "Graph cases unavailable";
    orderList.innerHTML = `<p class="order-load-error">${escapeHtml(error.message)}. Start FalkorDB and refresh.</p>`;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const orderId = input.value.trim();
  if (!orderId) { message.textContent = "Enter an order ID to investigate."; return; }
  button.disabled = true;
  message.textContent = "Tracing connected graph evidence…";
  results.hidden = true;
  try {
    const response = await fetch(`/api/investigate/${encodeURIComponent(orderId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.hint ? `${data.error}: ${data.hint}` : data.error || "Investigation failed");
    const row = data.investigation.rows[0];
    showPath(row);
    document.querySelector("#result-title").textContent = `Order ${row.orderId}`;
    const pill = document.querySelector("#status-pill");
    pill.textContent = row.orderStatus;
    pill.className = `status-pill ${String(row.orderStatus).toLowerCase()}`;
    document.querySelector("#incident-id").textContent = row.incidentId;
    document.querySelector("#incident-text").textContent = row.incident;
    document.querySelector("#severity").textContent = row.severity;
    document.querySelector("#severity").className = String(row.severity).toLowerCase();
    document.querySelector("#runbook").textContent = row.recommendedRunbook;
    document.querySelector("#action").textContent = row.recommendedAction;
    document.querySelector("#team").textContent = row.responsibleTeam;
    document.querySelector("#why-this").textContent = `Why this match: ${row.recordedEvent} connects to ${row.api}, which depends on ${row.service}. ${row.incidentId} affects that service, and its linked runbook provides the next step.`;
    results.hidden = false;
    message.textContent = "";
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    message.textContent = error.message.includes("fetch") ? "Could not reach OrderLens. Check that the app and FalkorDB are running." : error.message;
  } finally { button.disabled = false; }
});

orderList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-order-id]");
  if (!card) return;
  input.value = card.dataset.orderId;
  form.requestSubmit();
});

fetch("/api/health").then((response) => response.json()).then((data) => {
  const state = document.querySelector("#db-state");
  const pulse = document.querySelector(".pulse");
  if (data.status === "ok") { state.textContent = `Connected · ${data.graph} graph`; pulse.classList.add("online"); }
  else state.textContent = "Database unavailable";
}).catch(() => { document.querySelector("#db-state").textContent = "API unavailable"; });

loadOrders();
