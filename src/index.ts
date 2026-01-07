import { PriceScheduler } from './scheduler/scheduler.js';
import { WebServer } from './server/server.js';
import { config } from './config/config.js';
import { logger } from './utils/logger.js';

// Handle graceful shutdown
let scheduler: PriceScheduler | null = null;
let webServer: WebServer | null = null;

function setupGracefulShutdown(): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  signals.forEach(signal => {
    process.on(signal, () => {
      logger.info({ signal }, 'Received shutdown signal');

      if (scheduler) {
        scheduler.stop();
      }

      if (webServer) {
        webServer.stop();
      }

      logger.info('Application shutdown complete');
      process.exit(0);
    });
  });
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception');
  process.exit(1);
});

async function main(): Promise<void> {
  try {
    logger.info('🚀 Amber Price Monitor starting...');

    logger.info({
      threshold: `${config.monitoring.feedInThreshold}c/kWh`,
      interval: config.monitoring.checkInterval,
      timezone: config.monitoring.timezone,
      channels: config.notifications.channels,
    }, 'Configuration loaded');

    // Start web server
    webServer = new WebServer(3000);
    await webServer.start();

    // Create and start scheduler
    scheduler = new PriceScheduler();

    // Run an immediate check on startup
    logger.info('Running initial price check...');
    await scheduler.runImmediately();

    // Start the scheduled monitoring
    scheduler.start();

    logger.info('✓ Application started successfully');
    logger.info(`📊 Web Dashboard: http://localhost:3000`);
    logger.info(`Monitoring feed-in prices. Threshold: ${config.monitoring.feedInThreshold}c/kWh`);
    logger.info(`Press Ctrl+C to stop`);

    // Set up graceful shutdown
    setupGracefulShutdown();

  } catch (error) {
    logger.fatal({ error }, 'Failed to start application');
    process.exit(1);
  }
}

// Start the application
main();
