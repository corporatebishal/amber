import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

export interface PriceHistoryRecord {
  price: number;
  nemTime: string;
  descriptor: string;
  renewables: number;
  timestamp: string;
  channelType?: string;
}

export class FileStorage {
  private dataDir: string;
  private historyFile: string;
  private maxRecords: number;

  constructor(dataDir: string = './data', maxRecords: number = 2016) { // 2016 = 42 days at 30-min intervals
    this.dataDir = dataDir;
    this.historyFile = path.join(dataDir, 'price-history.json');
    this.maxRecords = maxRecords;
  }

  /**
   * Initialize storage directory
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      logger.info({ dataDir: this.dataDir }, 'File storage initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize file storage');
      throw error;
    }
  }

  /**
   * Load price history from file
   */
  async loadHistory(): Promise<PriceHistoryRecord[]> {
    try {
      const data = await fs.readFile(this.historyFile, 'utf-8');
      const records = JSON.parse(data) as PriceHistoryRecord[];
      logger.info({ count: records.length }, 'Loaded price history from file');
      return records;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.info('No existing price history file, starting fresh');
        return [];
      }
      logger.error({ error }, 'Failed to load price history');
      return [];
    }
  }

  /**
   * Save price history to file
   */
  async saveHistory(records: PriceHistoryRecord[]): Promise<void> {
    try {
      // Keep only the most recent records
      const trimmedRecords = records.slice(0, this.maxRecords);

      await fs.writeFile(
        this.historyFile,
        JSON.stringify(trimmedRecords, null, 2),
        'utf-8'
      );

      logger.debug({ count: trimmedRecords.length }, 'Saved price history to file');
    } catch (error) {
      logger.error({ error }, 'Failed to save price history');
      throw error;
    }
  }

  /**
   * Append a new record to history
   */
  async appendRecord(record: PriceHistoryRecord): Promise<void> {
    try {
      const history = await this.loadHistory();

      // Add new record at the beginning
      history.unshift(record);

      // Save updated history
      await this.saveHistory(history);
    } catch (error) {
      logger.error({ error }, 'Failed to append price record');
      throw error;
    }
  }

  /**
   * Get history for a specific time range
   */
  async getHistoryRange(startTime: Date, endTime: Date): Promise<PriceHistoryRecord[]> {
    try {
      const history = await this.loadHistory();

      return history.filter(record => {
        const recordTime = new Date(record.timestamp);
        return recordTime >= startTime && recordTime <= endTime;
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get history range');
      return [];
    }
  }

  /**
   * Clean up old records beyond retention period
   */
  async cleanup(): Promise<void> {
    try {
      const history = await this.loadHistory();
      const trimmed = history.slice(0, this.maxRecords);

      if (trimmed.length < history.length) {
        await this.saveHistory(trimmed);
        logger.info(
          { removed: history.length - trimmed.length },
          'Cleaned up old price records'
        );
      }
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup price history');
    }
  }
}

// Export singleton instance
export const fileStorage = new FileStorage();
