# 🚀 Blue-Green Deployment Quick Start

This guide shows you how to test blue-green deployment locally for the PingPong project.

## Option 1: Local Simulation (No Docker)

### Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Check current deployment state
npm run deploy:status

# 3. Run full deployment simulation
npm run deploy:simulate
```

### Output Example

```
🚀 Blue-Green Deployment Simulation
=====================================

📊 Current Deployment Status
================================
Active Environment: BLUE
  Port: 3001
  Version: 1.0.0

Inactive Environment: GREEN
  Port: 3002
  Version: 1.0.0

Last Deployment: 2024-04-18T12:00:00.000Z
================================

Step 2: Deploy to green (inactive environment)
────────────────────────────────────
📦 Deploying to GREEN environment (port 3002)
   Version: 1.0.0

  ⏳ Building application...
  ✓ Build successful

  ⏳ Starting GREEN environment...
  ✓ GREEN started on port 3002

  ⏳ Running health checks...
  ✓ Health check passed

Step 3: Run Tests & Validation
────────────────────────────────────
  Running smoke tests on green...
  ✓ API tests passed
  ✓ Socket.io tests passed
  ✓ Game logic tests passed

Step 4: Switch Traffic
────────────────────────────────────
🔄 Switching traffic to GREEN environment

  ⏳ Verifying GREEN health...
  ✓ GREEN is healthy

  ⏳ Updating load balancer to point to GREEN...

✓ Traffic successfully switched to GREEN
  Old environment: blue
  New environment: green

✅ Deployment simulation complete!
```

## Option 2: Docker Compose (Recommended for Production Simulation)

### Prerequisites

```bash
# Install Docker and Docker Compose
docker --version
docker-compose --version
```

### Start Blue-Green Environment

```bash
# 1. Build and start all services
npm run docker:up

# Check status
docker-compose ps

# 2. Access the application
curl http://localhost:3000              # Load balancer (main)
curl http://localhost:3001/health       # Blue health check
curl http://localhost:3002/health       # Green health check
```

### View Logs

```bash
# All services
npm run docker:logs

# Specific environment
npm run docker:logs:blue
npm run docker:logs:green

# Or using docker directly
docker logs -f pingpong-blue
docker logs -f pingpong-green
```

### Simulate Full Deployment Cycle

```bash
# 1. Check status (Blue is active)
curl http://localhost:3000/status

# Output:
# {"status":"ok","backend":"blue","timestamp":"2024-04-18T12:00:00.000Z"}

# 2. Make a test request to Blue
curl -s http://localhost:3001/health | jq '.'

# 3. Update Green (in real scenario, you'd deploy new version)
docker-compose restart green

# 4. Health check Green
curl http://localhost:3002/health

# 5. Switch traffic via nginx configuration
# Edit nginx.conf and change:
#   upstream backend { server green:3002; }
# Then reload nginx
docker-compose exec nginx nginx -s reload

# 6. Verify traffic is now on Green
curl http://localhost:3000/status
# Output: {"status":"ok","backend":"green",...}
```

### Stop Services

```bash
# Stop and remove containers
npm run docker:down

# Or using docker directly
docker-compose down
```

## Option 3: Cloud Deployment (AWS Example)

### Architecture

```
AWS ELB (Load Balancer) on :80/:443
  ↓
  ├─ Blue EC2 Instance (3001) - ACTIVE
  └─ Green EC2 Instance (3002) - STANDBY
```

### Deployment Steps

```bash
# 1. Deploy to Green target group
aws elbv2 register-targets \
  --target-group-arn arn:aws:...green \
  --targets Id=i-0123456789abcdef0

# 2. Health checks
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:...green

# 3. Switch traffic
aws elbv2 modify-listener \
  --listener-arn arn:aws:...listener \
  --default-actions Type=forward,TargetGroupArn=arn:aws:...green

# 4. Monitor
aws cloudwatch get-metric-statistics \
  --namespace AWS/ELB \
  --metric-name HealthyHostCount
```

## Testing Scenarios

### Scenario 1: Successful Deployment

```bash
npm run deploy:status
npm run deploy:green
npm run deploy:switch
npm run deploy:status
```

Expected: Green becomes active, Blue on standby ✅

### Scenario 2: Instant Rollback

```bash
# After deployment
npm run deploy:status

# If issues detected
npm run deploy:switch  # Back to Blue

npm run deploy:status
```

Expected: Immediately back on Blue ✅

### Scenario 3: Test Health Checks

```bash
# Terminal 1: Watch Blue
watch curl http://localhost:3001/health

# Terminal 2: Stop Blue
docker-compose stop blue

# Observe: Health checks fail
# Load balancer would remove it from rotation
```

Expected: Health checks times out ✅

## Monitoring During Deployment

### Check Traffic Distribution

```bash
# Real-time connection count
docker stats

# Request logs
docker-compose logs -f nginx
```

### Check Application Health

```bash
# Continuous health monitoring
while true; do
  echo "=== Blue ==="
  curl -s http://localhost:3001/health | jq '.status'
  echo "=== Green ==="
  curl -s http://localhost:3002/health | jq '.status'
  sleep 5
done
```

### Monitor Resource Usage

```bash
# Docker stats
docker stats pingpong-blue pingpong-green

# Or system monitoring
top
```

## Troubleshooting

### Containers won't start?

```bash
# Check logs
docker-compose logs

# Remove and rebuild
docker-compose down
docker-compose up --build
```

### Health checks failing?

```bash
# Manually check each service
curl http://localhost:3001/health
curl http://localhost:3002/health

# Check if containers are running
docker ps | grep pingpong

# Restart specific container
docker-compose restart blue
```

### Load balancer not routing correctly?

```bash
# Verify nginx is running
docker ps | grep nginx

# Check nginx config
docker-compose exec nginx cat /etc/nginx/nginx.conf

# Reload nginx
docker-compose exec nginx nginx -s reload
```

### Port conflicts?

```bash
# Find what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Kill the process
kill -9 <PID>
```

## Key Endpoints

| Endpoint | Purpose | Blue | Green |
|----------|---------|------|-------|
| `/health` | Quick health check | :3001 | :3002 |
| `/health/live` | Liveness probe | :3001 | :3002 |
| `/health/ready` | Readiness probe | :3001 | :3002 |
| `/status` | Load balancer status | :3000 | :3000 |
| `/` | Main app | :3000 | :3000 |

## Metrics to Track

✅ **Deployment Success Rate**: 100%  
✅ **Health Check Pass Rate**: 100%  
✅ **Rollback Time**: < 30 seconds  
✅ **Zero Downtime**: Yes  
✅ **Error Rate Post-Deploy**: No increase  

## Next Steps

1. **Integrate with CI/CD**: Update GitHub Actions (already done!)
2. **Add Monitoring**: Prometheus, DataDog, or CloudWatch
3. **Set Alerts**: Alert on deployment failures
4. **Document Runbooks**: Create operational procedures
5. **Train Team**: Ensure team understands blue-green deployment

## Resources

- [BLUE_GREEN_DEPLOYMENT.md](./BLUE_GREEN_DEPLOYMENT.md) - Detailed strategy
- [docker-compose.yml](./docker-compose.yml) - Docker setup
- [nginx.conf](./nginx.conf) - Load balancer configuration
- [deploy-simulator.ts](./deploy-simulator.ts) - Deployment scripts
