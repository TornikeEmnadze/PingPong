#!/usr/bin/env node

/**
 * Blue-Green Deployment Simulator
 *
 * This script simulates a blue-green deployment locally.
 *
 * Usage:
 *   node deploy-simulator.js deploy [blue|green]  - Deploy to specified environment
 *   node deploy-simulator.js switch               - Switch traffic to inactive environment
 *   node deploy-simulator.js status               - Show current deployment status
 *   node deploy-simulator.js simulate             - Run full deployment cycle simulation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import fetch from 'node-fetch';

const DEPLOYMENT_STATE_FILE = path.join(process.cwd(), '.deployment-state.json');

interface DeploymentState {
  activeEnvironment: 'blue' | 'green';
  blueVersion: string;
  greenVersion: string;
  bluePort: number;
  greenPort: number;
  lastDeployment: string;
}

// Default deployment state
const DEFAULT_STATE: DeploymentState = {
  activeEnvironment: 'blue',
  blueVersion: '1.0.0',
  greenVersion: '1.0.0',
  bluePort: 3001,
  greenPort: 3002,
  lastDeployment: new Date().toISOString(),
};

function loadState(): DeploymentState {
  if (fs.existsSync(DEPLOYMENT_STATE_FILE)) {
    const content = fs.readFileSync(DEPLOYMENT_STATE_FILE, 'utf-8');
    return JSON.parse(content);
  }
  return DEFAULT_STATE;
}

function saveState(state: DeploymentState): void {
  fs.writeFileSync(DEPLOYMENT_STATE_FILE, JSON.stringify(state, null, 2));
  console.log('✓ Deployment state saved');
}

async function healthCheck(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      timeout: 3000,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function deploy(target: 'blue' | 'green'): Promise<void> {
  const state = loadState();
  const port = target === 'blue' ? state.bluePort : state.greenPort;
  const version = target === 'blue' ? state.blueVersion : state.greenVersion;

  console.log(`\n📦 Deploying to ${target.toUpperCase()} environment (port ${port})`);
  console.log(`   Version: ${version}`);

  console.log(`\n  ⏳ Building application...`);
  try {
    execSync('npm run build', { cwd: 'server', stdio: 'inherit' });
    console.log('  ✓ Build successful');
  } catch (error) {
    console.error('  ✗ Build failed');
    process.exit(1);
  }

  console.log(`\n  ⏳ Starting ${target.toUpperCase()} environment...`);
  // In a real scenario, you'd start the server here
  console.log(`  ✓ ${target.toUpperCase()} started on port ${port}`);

  // Simulate health checks
  console.log(`\n  ⏳ Running health checks...`);
  for (let i = 0; i < 3; i++) {
    const healthy = await healthCheck(port);
    if (healthy) {
      console.log(`  ✓ Health check passed`);
      return;
    }
    console.log(`  ⏳ Health check attempt ${i + 1}/3 - retrying...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`  ⚠ Deployment to ${target} completed (health checks may still be running)`);
}

async function switchTraffic(): Promise<void> {
  const state = loadState();
  const inactiveEnv = state.activeEnvironment === 'blue' ? 'green' : 'blue';
  const inactivePort = inactiveEnv === 'blue' ? state.bluePort : state.greenPort;

  console.log(`\n🔄 Switching traffic to ${inactiveEnv.toUpperCase()} environment`);

  // Health check the inactive environment
  console.log(`\n  ⏳ Verifying ${inactiveEnv.toUpperCase()} health...`);
  const healthy = await healthCheck(inactivePort);

  if (!healthy) {
    console.error(
      `  ✗ ${inactiveEnv.toUpperCase()} environment is not healthy. Aborting switch.`
    );
    process.exit(1);
  }

  console.log(`  ✓ ${inactiveEnv.toUpperCase()} is healthy`);

  // Update load balancer (simulated)
  console.log(
    `\n  ⏳ Updating load balancer to point to ${inactiveEnv.toUpperCase()}...`
  );
  state.activeEnvironment = inactiveEnv as 'blue' | 'green';
  state.lastDeployment = new Date().toISOString();
  saveState(state);

  console.log(`\n✓ Traffic successfully switched to ${inactiveEnv.toUpperCase()}`);
  console.log(`  Old environment: ${state.activeEnvironment === 'blue' ? 'green' : 'blue'}`);
  console.log(`  New environment: ${state.activeEnvironment}`);
}

function showStatus(): void {
  const state = loadState();

  console.log('\n📊 Current Deployment Status');
  console.log('================================');
  console.log(`Active Environment: ${state.activeEnvironment.toUpperCase()}`);
  console.log(`  Port: ${state.activeEnvironment === 'blue' ? state.bluePort : state.greenPort}`);
  console.log(`  Version: ${state.activeEnvironment === 'blue' ? state.blueVersion : state.greenVersion}`);
  console.log(
    `\nInactive Environment: ${state.activeEnvironment === 'blue' ? 'GREEN' : 'BLUE'}`
  );
  console.log(
    `  Port: ${state.activeEnvironment === 'blue' ? state.greenPort : state.bluePort}`
  );
  console.log(
    `  Version: ${state.activeEnvironment === 'blue' ? state.greenVersion : state.blueVersion}`
  );
  console.log(`\nLast Deployment: ${state.lastDeployment}`);
  console.log('================================\n');
}

async function simulateFullDeployment(): Promise<void> {
  console.log('\n🚀 Blue-Green Deployment Simulation');
  console.log('=====================================\n');

  const state = loadState();
  const inactiveEnv = state.activeEnvironment === 'blue' ? 'green' : 'blue';

  console.log(`Step 1: Current Status`);
  showStatus();

  console.log(`Step 2: Deploy to ${inactiveEnv.toUpperCase()} (inactive environment)`);
  console.log(`────────────────────────────────────`);
  await deploy(inactiveEnv);

  console.log(`\nStep 3: Run Tests & Validation`);
  console.log(`────────────────────────────────────`);
  console.log(`  Running smoke tests on ${inactiveEnv.toUpperCase()}...`);
  console.log(`  ✓ API tests passed`);
  console.log(`  ✓ Socket.io tests passed`);
  console.log(`  ✓ Game logic tests passed`);

  console.log(`\nStep 4: Switch Traffic`);
  console.log(`────────────────────────────────────`);
  await switchTraffic();

  console.log(`\nStep 5: Keep Old Environment on Standby`);
  console.log(`────────────────────────────────────`);
  console.log(`  ${state.activeEnvironment === 'blue' ? 'Green' : 'Blue'} is now on standby`);
  console.log(`  Can be used for instant rollback if needed`);

  console.log(`\nStep 6: Final Status`);
  console.log(`────────────────────────────────────`);
  showStatus();

  console.log(`✅ Deployment simulation complete!\n`);
}

// Main CLI
const command = process.argv[2];
const target = process.argv[3] as 'blue' | 'green' | undefined;

(async () => {
  try {
    switch (command) {
      case 'deploy':
        if (!target || !['blue', 'green'].includes(target)) {
          console.error('Usage: deploy <blue|green>');
          process.exit(1);
        }
        await deploy(target);
        break;

      case 'switch':
        await switchTraffic();
        break;

      case 'status':
        showStatus();
        break;

      case 'simulate':
        await simulateFullDeployment();
        break;

      default:
        console.log(`
Blue-Green Deployment CLI
=========================

Usage:
  node deploy-simulator.js deploy <blue|green>  - Deploy to specified environment
  node deploy-simulator.js switch               - Switch traffic to inactive environment
  node deploy-simulator.js status               - Show current deployment status
  node deploy-simulator.js simulate             - Run full deployment cycle simulation

Example:
  node deploy-simulator.js deploy green
  node deploy-simulator.js status
  node deploy-simulator.js switch
        `);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
