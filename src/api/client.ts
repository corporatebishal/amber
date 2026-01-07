import axios, { AxiosInstance, AxiosError } from 'axios';
import type { Site, Interval } from './types.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class AmberClient {
  private client: AxiosInstance;
  public lastRateLimit: {
    limit: string | null;
    remaining: string | null;
    reset: string | null;
  } = {
    limit: null,
    remaining: null,
    reset: null,
  };

  constructor() {
    this.client = axios.create({
      baseURL: config.amber.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.amber.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add response interceptor for rate limit logging
    this.client.interceptors.response.use(
      (response) => {
        const rateLimit = {
          limit: response.headers['ratelimit-limit'],
          remaining: response.headers['ratelimit-remaining'],
          reset: response.headers['ratelimit-reset'],
        };

        // Store rate limit info
        this.lastRateLimit = rateLimit;

        if (rateLimit.remaining && parseInt(rateLimit.remaining) < 10) {
          logger.warn({ rateLimit }, 'API rate limit running low');
        }

        return response;
      },
      (error) => {
        // Capture rate limit from error response too
        if (error.response?.headers) {
          this.lastRateLimit = {
            limit: error.response.headers['ratelimit-limit'] || null,
            remaining: error.response.headers['ratelimit-remaining'] || null,
            reset: error.response.headers['ratelimit-reset'] || null,
          };
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch all sites associated with the API key
   */
  async getSites(): Promise<Site[]> {
    try {
      logger.debug('Fetching sites from Amber API');
      const response = await this.client.get<Site[]>('/sites');
      logger.debug({ count: response.data.length }, 'Sites fetched successfully');
      return response.data;
    } catch (error) {
      this.handleError('Failed to fetch sites', error);
      throw error;
    }
  }

  /**
   * Fetch current prices for a specific site
   * @param siteId - The site ID (optional, will use first active site if not provided)
   * @param options - Additional query parameters
   */
  async getCurrentPrices(
    siteId?: string,
    options?: {
      next?: number;
      previous?: number;
      resolution?: 5 | 30;
    }
  ): Promise<Interval[]> {
    try {
      // If no siteId provided, fetch from sites
      let targetSiteId = siteId || config.amber.siteId;

      if (!targetSiteId) {
        const sites = await this.getSites();
        const activeSite = sites.find(s => s.status === 'active');

        if (!activeSite) {
          throw new Error('No active sites found. Please check your Amber account.');
        }

        targetSiteId = activeSite.id;
        logger.info({ siteId: targetSiteId, nmi: activeSite.nmi }, 'Using active site');
      }

      logger.debug({ siteId: targetSiteId, options }, 'Fetching current prices');

      const response = await this.client.get<Interval[]>(
        `/sites/${targetSiteId}/prices/current`,
        { params: options }
      );

      logger.debug({ count: response.data.length }, 'Prices fetched successfully');
      return response.data;
    } catch (error) {
      this.handleError('Failed to fetch current prices', error);
      throw error;
    }
  }

  /**
   * Fetch prices for a date range
   */
  async getPrices(
    siteId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      resolution?: 5 | 30;
    }
  ): Promise<Interval[]> {
    try {
      logger.debug({ siteId, options }, 'Fetching prices for date range');

      const response = await this.client.get<Interval[]>(
        `/sites/${siteId}/prices`,
        { params: options }
      );

      logger.debug({ count: response.data.length }, 'Prices fetched successfully');
      return response.data;
    } catch (error) {
      this.handleError('Failed to fetch prices', error);
      throw error;
    }
  }

  /**
   * Fetch usage data for a date range
   * @param siteId - The site ID (optional, will use first active site if not provided)
   * @param options - Date range and resolution options
   */
  async getUsage(
    siteId?: string,
    options?: {
      startDate?: string;
      endDate?: string;
      resolution?: 5 | 30;
    }
  ): Promise<any[]> {
    try {
      // If no siteId provided, fetch from sites
      let targetSiteId = siteId || config.amber.siteId;

      if (!targetSiteId) {
        const sites = await this.getSites();
        const activeSite = sites.find(s => s.status === 'active');

        if (!activeSite) {
          throw new Error('No active sites found. Please check your Amber account.');
        }

        targetSiteId = activeSite.id;
      }

      logger.debug({ siteId: targetSiteId, options }, 'Fetching usage data');

      const response = await this.client.get<any[]>(
        `/sites/${targetSiteId}/usage`,
        { params: options }
      );

      logger.debug({ count: response.data.length }, 'Usage data fetched successfully');
      return response.data;
    } catch (error) {
      this.handleError('Failed to fetch usage data', error);
      throw error;
    }
  }

  /**
   * Retry a request with exponential backoff
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          logger.warn(
            { attempt: attempt + 1, maxRetries, delay },
            'Request failed, retrying...'
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Handle API errors with proper logging
   */
  private handleError(message: string, error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        logger.error(
          {
            status: axiosError.response.status,
            statusText: axiosError.response.statusText,
            data: axiosError.response.data,
          },
          message
        );
      } else if (axiosError.request) {
        logger.error({ error: axiosError.message }, `${message} - No response received`);
      } else {
        logger.error({ error: axiosError.message }, `${message} - Request setup failed`);
      }
    } else {
      logger.error({ error }, message);
    }
  }
}

export const amberClient = new AmberClient();
