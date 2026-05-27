# Performance Testing Guide

## Overview
This document outlines performance testing procedures for the HR 360 application, including load testing, stress testing, and performance benchmarking.

---

## 1. Load Testing

### 1.1 Alert Broadcast Load Test

**Objective**: Test system performance when broadcasting alerts to large user base

**Test Setup**:
```bash
# Install load testing tools
npm install -g artillery

# Create load test configuration
```

**Test Configuration** (`load-test-alerts.yml`):
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Sustained load"
  processor: "./load-test-processor.js"

scenarios:
  - name: "Alert Broadcast"
    flow:
      - post:
          url: "/alerts/broadcast"
          json:
            title: "Load Test Alert"
            message: "This is a load test alert"
            severity: "high"
            type: "test"
          headers:
            Authorization: "Bearer {{ token }}"
          capture:
            json: "$.id"
            as: "alertId"
```

**Execution**:
```bash
artillery run load-test-alerts.yml
```

**Success Criteria**:
- Response time p95 < 500ms
- Response time p99 < 1000ms
- Error rate < 1%
- Throughput > 100 requests/sec

---

### 1.2 Push Notification Delivery Load Test

**Objective**: Test push notification service under load

**Test Configuration**:
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 20
      name: "Ramp up"
    - duration: 60
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "Send Push Notifications"
    flow:
      - post:
          url: "/notifications/send"
          json:
            userIds: ["user-1", "user-2", "user-3"]
            title: "Test Notification"
            body: "Load test notification"
            type: "alert"
          headers:
            Authorization: "Bearer {{ token }}"
```

**Success Criteria**:
- All notifications delivered within 5 seconds
- No dropped notifications
- Error rate < 0.5%

---

### 1.3 Sync Operations Load Test

**Objective**: Test sync service under concurrent load

**Test Configuration**:
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 20
      name: "Warm up"
    - duration: 120
      arrivalRate: 100
      name: "Ramp up"
    - duration: 60
      arrivalRate: 200
      name: "Sustained load"

scenarios:
  - name: "Sync Operations"
    flow:
      - post:
          url: "/sync"
          json:
            operations:
              - type: "create"
                entity: "checkin"
                data: { status: "safe" }
              - type: "update"
                entity: "contact"
                data: { id: "contact-1", name: "Updated" }
          headers:
            Authorization: "Bearer {{ token }}"
```

**Success Criteria**:
- Sync completes within 2 seconds
- No data loss
- Conflict resolution works correctly
- Error rate < 1%

---

## 2. Stress Testing

### 2.1 Concurrent User Stress Test

**Objective**: Test system behavior under extreme load

**Test Script** (`stress-test.js`):
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const NUM_USERS = 1000;
const CONCURRENT_REQUESTS = 100;

async function stressTest() {
  console.log(`Starting stress test with ${NUM_USERS} users...`);
  
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  const responseTimes = [];

  for (let i = 0; i < NUM_USERS; i += CONCURRENT_REQUESTS) {
    const batch = [];
    
    for (let j = 0; j < CONCURRENT_REQUESTS && i + j < NUM_USERS; j++) {
      const userId = `stress-user-${i + j}`;
      
      batch.push(
        axios.post(`${API_URL}/alerts/broadcast`, {
          title: 'Stress Test Alert',
          message: 'Testing system under stress',
          severity: 'high',
          type: 'test',
        }, {
          headers: {
            Authorization: `Bearer ${getToken(userId)}`,
          },
        })
        .then(() => {
          successCount++;
          responseTimes.push(Date.now() - startTime);
        })
        .catch((error) => {
          errorCount++;
          console.error(`Request failed: ${error.message}`);
        })
      );
    }
    
    await Promise.all(batch);
    console.log(`Completed ${Math.min(i + CONCURRENT_REQUESTS, NUM_USERS)}/${NUM_USERS} requests`);
  }

  const totalTime = Date.now() - startTime;
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const maxResponseTime = Math.max(...responseTimes);
  const minResponseTime = Math.min(...responseTimes);

  console.log('\n=== Stress Test Results ===');
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Success Rate: ${((successCount / NUM_USERS) * 100).toFixed(2)}%`);
  console.log(`Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Min Response Time: ${minResponseTime}ms`);
  console.log(`Max Response Time: ${maxResponseTime}ms`);
  console.log(`Throughput: ${(NUM_USERS / (totalTime / 1000)).toFixed(2)} req/sec`);
}

stressTest().catch(console.error);
```

**Execution**:
```bash
node stress-test.js
```

**Success Criteria**:
- Success rate > 99%
- Response time p95 < 1000ms
- System recovers after stress
- No memory leaks

---

### 2.2 Database Connection Pool Stress Test

**Objective**: Test database connection handling

**Test Script** (`db-stress-test.js`):
```javascript
const { getConnection } = require('./config/database');

async function dbStressTest() {
  console.log('Starting database stress test...');
  
  const NUM_CONNECTIONS = 100;
  const QUERIES_PER_CONNECTION = 10;
  
  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  const promises = [];

  for (let i = 0; i < NUM_CONNECTIONS; i++) {
    promises.push(
      (async () => {
        try {
          const connection = await getConnection();
          
          for (let j = 0; j < QUERIES_PER_CONNECTION; j++) {
            await connection.query('SELECT 1');
            successCount++;
          }
          
          await connection.close();
        } catch (error) {
          errorCount++;
          console.error(`Connection error: ${error.message}`);
        }
      })()
    );
  }

  await Promise.all(promises);

  const totalTime = Date.now() - startTime;
  const totalQueries = NUM_CONNECTIONS * QUERIES_PER_CONNECTION;

  console.log('\n=== Database Stress Test Results ===');
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Total Queries: ${totalQueries}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Success Rate: ${((successCount / totalQueries) * 100).toFixed(2)}%`);
  console.log(`Queries/sec: ${(totalQueries / (totalTime / 1000)).toFixed(2)}`);
}

dbStressTest().catch(console.error);
```

---

## 3. Performance Benchmarking

### 3.1 API Endpoint Benchmarks

**Benchmark Script** (`benchmark.js`):
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const ITERATIONS = 100;

async function benchmark(name, fn) {
  console.log(`\nBenchmarking: ${name}`);
  
  const times = [];
  
  for (let i = 0; i < ITERATIONS; i++) {
    const start = Date.now();
    await fn();
    times.push(Date.now() - start);
  }

  times.sort((a, b) => a - b);
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  console.log(`  Avg: ${avg.toFixed(2)}ms`);
  console.log(`  P50: ${p50}ms`);
  console.log(`  P95: ${p95}ms`);
  console.log(`  P99: ${p99}ms`);
}

async function runBenchmarks() {
  // Benchmark GET alerts
  await benchmark('GET /alerts', async () => {
    await axios.get(`${API_URL}/alerts?orgId=test-org`, {
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  // Benchmark POST alert
  await benchmark('POST /alerts/broadcast', async () => {
    await axios.post(`${API_URL}/alerts/broadcast`, {
      title: 'Test',
      message: 'Test',
      severity: 'high',
      type: 'test',
    }, {
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  // Benchmark GET notifications
  await benchmark('GET /notifications', async () => {
    await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  // Benchmark POST sync
  await benchmark('POST /sync', async () => {
    await axios.post(`${API_URL}/sync`, {
      operations: [
        { type: 'create', entity: 'checkin', data: { status: 'safe' } },
      ],
    }, {
      headers: { Authorization: 'Bearer test-token' },
    });
  });
}

runBenchmarks().catch(console.error);
```

**Execution**:
```bash
node benchmark.js
```

---

## 4. Memory Profiling

### 4.1 Memory Leak Detection

**Script** (`memory-profile.js`):
```javascript
const v8 = require('v8');
const fs = require('fs');

async function profileMemory() {
  console.log('Starting memory profiling...');
  
  // Take initial snapshot
  const snapshot1 = v8.writeHeapSnapshot();
  console.log(`Snapshot 1: ${snapshot1}`);

  // Run operations
  for (let i = 0; i < 1000; i++) {
    // Simulate operations
    const data = new Array(1000).fill(Math.random());
  }

  // Force garbage collection
  if (global.gc) {
    global.gc();
  }

  // Take second snapshot
  const snapshot2 = v8.writeHeapSnapshot();
  console.log(`Snapshot 2: ${snapshot2}`);

  console.log('Memory profiling complete. Compare snapshots for leaks.');
}

profileMemory().catch(console.error);
```

**Execution**:
```bash
node --expose-gc memory-profile.js
```

---

## 5. WebSocket Performance

### 5.1 WebSocket Connection Load Test

**Script** (`websocket-load-test.js`):
```javascript
const io = require('socket.io-client');

async function websocketLoadTest() {
  console.log('Starting WebSocket load test...');
  
  const NUM_CONNECTIONS = 100;
  const connections = [];
  let messageCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < NUM_CONNECTIONS; i++) {
    const socket = io('http://localhost:3000', {
      auth: {
        token: `test-token-${i}`,
      },
    });

    socket.on('notification:received', () => {
      messageCount++;
    });

    connections.push(socket);
  }

  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Send broadcast
  const broadcastStart = Date.now();
  // Simulate broadcast from server
  connections[0].emit('notification:received', { test: true });

  // Wait for messages
  await new Promise(resolve => setTimeout(resolve, 5000));

  const totalTime = Date.now() - startTime;
  const broadcastTime = Date.now() - broadcastStart;

  console.log('\n=== WebSocket Load Test Results ===');
  console.log(`Total Connections: ${NUM_CONNECTIONS}`);
  console.log(`Messages Received: ${messageCount}`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Broadcast Time: ${broadcastTime}ms`);

  // Cleanup
  connections.forEach(socket => socket.disconnect());
}

websocketLoadTest().catch(console.error);
```

---

## 6. Performance Targets

### API Response Times
- GET endpoints: < 200ms (p95)
- POST endpoints: < 500ms (p95)
- Bulk operations: < 2000ms (p95)

### Push Notifications
- Delivery time: < 5 seconds
- Success rate: > 99.5%

### Sync Operations
- Sync completion: < 2 seconds
- Conflict resolution: < 1 second

### WebSocket
- Message delivery: < 100ms
- Connection establishment: < 500ms
- Broadcast to 1000 users: < 5 seconds

### Database
- Query response: < 100ms (p95)
- Connection pool: 100+ concurrent connections
- Throughput: > 1000 queries/sec

---

## 7. Monitoring & Alerts

### Key Metrics to Monitor
- Response time (p50, p95, p99)
- Error rate
- Throughput (requests/sec)
- CPU usage
- Memory usage
- Database connection pool
- WebSocket connections
- Push notification delivery rate

### Alert Thresholds
- Response time p95 > 1000ms: Alert
- Error rate > 5%: Alert
- CPU usage > 80%: Alert
- Memory usage > 85%: Alert
- Database connections > 90%: Alert

---

## 8. Continuous Performance Testing

### CI/CD Integration
```yaml
# .github/workflows/performance-test.yml
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:performance
      - run: npm run benchmark
```

---

## 9. Performance Optimization Checklist

- [ ] Database query optimization
- [ ] Connection pooling configured
- [ ] Caching implemented (Redis)
- [ ] API response compression enabled
- [ ] WebSocket message batching
- [ ] Notification delivery optimization
- [ ] Memory leak fixes
- [ ] Code profiling completed
- [ ] Load balancing configured
- [ ] CDN configured for static assets

---

## 10. Reporting

### Performance Report Template
```
# Performance Test Report
Date: [Date]
Environment: [Staging/Production]

## Test Results
- Alert Broadcast: [Results]
- Push Notifications: [Results]
- Sync Operations: [Results]
- Database: [Results]
- WebSocket: [Results]

## Metrics
- Avg Response Time: [ms]
- P95 Response Time: [ms]
- Error Rate: [%]
- Throughput: [req/sec]

## Issues Found
- [Issue 1]
- [Issue 2]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

---

## References
- Artillery: https://artillery.io/
- Node.js Profiling: https://nodejs.org/en/docs/guides/simple-profiling/
- Performance Testing Best Practices: https://www.perfmatrix.com/performance-testing/
