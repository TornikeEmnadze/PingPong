# Blue-Green Deployment Strategy

This document outlines how to implement and simulate blue-green deployment for the PingPong project.

## What is Blue-Green Deployment?

Blue-Green deployment is a technique for reducing downtime and risk by running two nearly identical production environments called Blue and Green.

- **Blue**: Current production environment (receiving traffic)
- **Green**: Staging environment (not receiving traffic)

### Process Flow

```
Deployment Cycle:
┌─────────────────────────────────────────────────────────┐
│ 1. Current State: Blue is ACTIVE, Green is STANDBY      │
│    Users → Load Balancer → Blue (v1.0.0)               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Deploy to Green: Build & deploy Green (v2.0.0)       │
│    Users → Load Balancer → Blue (v1.0.0)               │
│    (Setup) → Green (v2.0.0 - warming up)               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Test Green: Run smoke tests, health checks            │
│    Users → Load Balancer → Blue (v1.0.0)               │
│    (Validating) → Green (v2.0.0 - ready)               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Switch Traffic: Update load balancer to Green        │
│    Users → Load Balancer → Green (v2.0.0)              │
│    (Standby) → Blue (v1.0.0 - ready for rollback)      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Standby State: Blue ready for instant rollback       │
│    Keep running for fast rollback if needed             │
└─────────────────────────────────────────────────────────┘
```

## Advantages

✅ **Zero Downtime**: Traffic switches instantly  
✅ **Fast Rollback**: Keep old version ready to serve immediately  
✅ **Easy Testing**: Full production environment testing before switch  
✅ **Reduced Risk**: Easy to validate before traffic switch  

## Local Simulation

### Prerequisites

```bash
npm install
npm run build

# Or use the provided script
npm install node-fetch
```

### Simulate Full Deployment Cycle

```bash
# Run complete blue-green deployment simulation
npm run deploy:simulate

# Or individual steps:
npm run deploy:status              # Show current state
npm run deploy:blue                # Deploy to blue
npm run deploy:green               # Deploy to green
npm run deploy:switch              # Switch traffic
```

### What Gets Simulated

1. **Deploy**: Builds code and deploys to inactive environment
2. **Health Checks**: Verifies new environment is healthy
3. **Smoke Tests**: Validates critical functionality
4. **Traffic Switch**: Updates load balancer configuration
5. **Rollback Ready**: Old environment stays on standby

## Architecture

### Port Configuration

- **Blue Environment**: Port 3001
- **Green Environment**: Port 3002
- **Load Balancer**: Port 3000

### Health Check Endpoints

All health checks use `/health` endpoint:

```bash
# Liveness probe (server is alive)
curl http://localhost:3001/health/live

# Readiness probe (ready for traffic)
curl http://localhost:3001/health/ready

# Full health check
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-04-18T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "blue"
}
```

## Deployment State File

The simulator maintains deployment state in `.deployment-state.json`:

```json
{
  "activeEnvironment": "blue",
  "blueVersion": "1.0.0",
  "greenVersion": "1.0.0",
  "bluePort": 3001,
  "greenPort": 3002,
  "lastDeployment": "2024-04-18T12:00:00.000Z"
}
```

## Production Deployment with Nginx

### Nginx Configuration Example

```nginx
upstream blue_backend {
    server localhost:3001;
}

upstream green_backend {
    server localhost:3002;
}

# Blue is active by default
upstream backend {
    server localhost:3001;
}

server {
    listen 3000;
    server_name _;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoints
    location /health {
        access_log off;
        proxy_pass http://backend;
    }
}
```

To switch traffic, update `upstream backend` to point to the new environment.

## CI/CD Integration

The deployment is integrated into GitHub Actions:

```yaml
deploy:
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  needs: [test, build]
  steps:
    - name: Deploy to inactive environment
      run: npm run deploy:green  # Or deploy:blue
    
    - name: Run smoke tests
      run: npm run test:smoke
    
    - name: Switch traffic
      run: npm run deploy:switch
```

## Monitoring & Alerts

### Key Metrics to Monitor

- **Deployment Duration**: Should complete in < 5 minutes
- **Health Check Success Rate**: Should be 100%
- **Error Rate**: Should not increase post-deployment
- **Latency**: Should remain consistent

### Rollback Procedure

If issues detected post-deployment:

```bash
# Instant rollback - all traffic diverted back to previous environment
npm run deploy:switch
```

Old environment is already running and tested, so rollback is immediate with zero downtime.

## Practical Exercise

### Simulate a Deployment with Rollback

```bash
# 1. Check current status
npm run deploy:status

# 2. Deploy new version to inactive environment
npm run deploy:green

# 3. Run tests (if they fail, rollback immediately)
npm run test:smoke

# 4. Switch traffic
npm run deploy:switch

# 5. If issues detected, rollback in seconds
npm run deploy:switch  # Switches back to blue
```

## Advanced: Docker Compose Setup

For more realistic simulation with actual Docker containers:

See `docker-compose.yml` in the project root.

```bash
docker-compose up -d
npm run deploy:simulate
```

## Troubleshooting

### Health checks failing?
- Ensure servers are running on configured ports
- Check logs: `npm run logs:blue` or `npm run logs:green`
- Verify endpoints are accessible: `curl http://localhost:3001/health`

### Traffic not switching?
- Verify load balancer configuration
- Check deployment state file: `cat .deployment-state.json`
- Manual switch: Update upstream in nginx/load balancer config

### Slow deployments?
- Check build time: `npm run build -- --profile`
- Optimize dependencies
- Use incremental builds where possible
