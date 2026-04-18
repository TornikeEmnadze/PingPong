/**
 * Blue-Green Deployment Configuration
 * This file manages the configuration for blue-green deployments
 */

export interface DeploymentConfig {
  bluePort: number;
  greenPort: number;
  activeEnvironment: "blue" | "green";
  healthCheckPath: string;
  healthCheckInterval: number; // milliseconds
  healthCheckTimeout: number; // milliseconds
}

export const deploymentConfig: DeploymentConfig = {
  bluePort: process.env.BLUE_PORT ? parseInt(process.env.BLUE_PORT) : 3001,
  greenPort: process.env.GREEN_PORT ? parseInt(process.env.GREEN_PORT) : 3002,
  activeEnvironment: (process.env.ACTIVE_ENV as "blue" | "green") || "blue",
  healthCheckPath: "/health",
  healthCheckInterval: 5000, // Check every 5 seconds
  healthCheckTimeout: 3000, // Wait 3 seconds for response
};

export function getActivePort(): number {
  return deploymentConfig.activeEnvironment === "blue"
    ? deploymentConfig.bluePort
    : deploymentConfig.greenPort;
}

export function getInactivePort(): number {
  return deploymentConfig.activeEnvironment === "blue"
    ? deploymentConfig.greenPort
    : deploymentConfig.bluePort;
}

export function getActiveEnvironment(): "blue" | "green" {
  return deploymentConfig.activeEnvironment;
}

export function getInactiveEnvironment(): "blue" | "green" {
  return deploymentConfig.activeEnvironment === "blue" ? "green" : "blue";
}
