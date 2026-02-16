
/***
 * Interface representing the definition of a SalesForecast item.
 * This information is stored in Fabric as Item definition. 
 * It will be returned once the item definition is loaded.
 */
export interface SalesForecastItemDefinition  {
  // Configuration
  sourceLakehouseId?: string;
  sourceLakehouseName?: string;
  sourceTable?: string;
  targetLakehouseId?: string;
  targetLakehouseName?: string;
  targetTable?: string;
  forecastMonths?: number;
  
  // Last run information
  lastRunDate?: string;
  lastRunStatus?: 'success' | 'error' | 'running';
  lastRunMessage?: string;
}

export interface SalesData {
  store: string;
  month: string;
  sales: number;
}

export interface ForecastResult {
  store: string;
  month: string;
  forecastedSales: number;
  confidenceLow?: number;
  confidenceHigh?: number;
}

export interface ForecastSummary {
  totalStores: number;
  historicalMonths: number;
  forecastMonths: number;
  results: ForecastResult[];
  generatedAt: string;
}
