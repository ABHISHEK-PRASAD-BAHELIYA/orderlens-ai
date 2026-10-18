
MERGE
  (o:Order {
    id: 'ORD-1042',
    status: 'STUCK'
  })
MERGE
  (e:TransactionEvent {
    name: 'Confirm recorded',
    status: 'SUCCESS'
  })
MERGE
  (api:API {
    name: 'Confirm API'
  })
MERGE
  (s:Service {
    name: 'SellerGateway'
  })
MERGE
  (i:Incident {
    id: 'INC-201',
    description: 'Expected seller status update missing',
    severity: 'HIGH'
  })
MERGE
  (r:Runbook {
    name: 'Check callback delivery',
    action: 'Inspect callback logs before retrying'
  })
MERGE
  (t:Team {
    name: 'Commerce Integrations'
  })
MERGE (o)-[:HAS_EVENT]->(e)
MERGE (e)-[:INVOKES]->(api)
MERGE (api)-[:DEPENDS_ON]->(s)
MERGE (i)-[:AFFECTS]->(s)
MERGE (i)-[:SUGGESTS]->(r)
MERGE (t)-[:OWNS]->(s)

MERGE (o2:Order {id: 'ORD-2088', status: 'PAYMENT_FAILED'})
MERGE (e2:TransactionEvent {name: 'Payment authorization', status: 'FAILED'})
MERGE (api2:API {name: 'Payment API'})
MERGE (s2:Service {name: 'PaymentService'})
MERGE (i2:Incident {id: 'INC-315', description: 'Payment processor declined authorization', severity: 'CRITICAL'})
MERGE (r2:Runbook {name: 'Verify processor response', action: 'Check the processor response code before retrying payment'})
MERGE (t2:Team {name: 'Payments Platform'})
MERGE (o2)-[:HAS_EVENT]->(e2)
MERGE (e2)-[:INVOKES]->(api2)
MERGE (api2)-[:DEPENDS_ON]->(s2)
MERGE (i2)-[:AFFECTS]->(s2)
MERGE (i2)-[:SUGGESTS]->(r2)
MERGE (t2)-[:OWNS]->(s2)

MERGE (o3:Order {id: 'ORD-3091', status: 'SHIPMENT_DELAYED'})
MERGE (e3:TransactionEvent {name: 'Shipment handoff', status: 'SUCCESS'})
MERGE (api3:API {name: 'Fulfillment API'})
MERGE (s3:Service {name: 'CarrierBridge'})
MERGE (i3:Incident {id: 'INC-428', description: 'Carrier pickup scan has not arrived', severity: 'MEDIUM'})
MERGE (r3:Runbook {name: 'Check carrier handoff', action: 'Confirm the dispatch manifest and contact the carrier for a pickup scan'})
MERGE (t3:Team {name: 'Logistics Integrations'})
MERGE (o3)-[:HAS_EVENT]->(e3)
MERGE (e3)-[:INVOKES]->(api3)
MERGE (api3)-[:DEPENDS_ON]->(s3)
MERGE (i3)-[:AFFECTS]->(s3)
MERGE (i3)-[:SUGGESTS]->(r3)
MERGE (t3)-[:OWNS]->(s3)
