import { SalesData, ForecastResult } from "./SalesForecastItemDefinition";

/**
 * Simple Moving Average forecast algorithm
 * Calculates forecast based on average of previous months
 */
export function generateForecast(
  historicalData: SalesData[],
  forecastMonths: number = 3
): ForecastResult[] {
  const results: ForecastResult[] = [];
  
  // Group data by store
  const storeData = new Map<string, SalesData[]>();
  historicalData.forEach((data) => {
    if (!storeData.has(data.store)) {
      storeData.set(data.store, []);
    }
    storeData.get(data.store)!.push(data);
  });

  // Generate forecasts for each store
  storeData.forEach((data, store) => {
    // Sort by month
    const sortedData = data.sort((a, b) => a.month.localeCompare(b.month));
    
    // Calculate moving average (use last 3 months or available data)
    const windowSize = Math.min(3, sortedData.length);
    const recentSales = sortedData.slice(-windowSize);
    const avgSales = recentSales.reduce((sum, d) => sum + d.sales, 0) / windowSize;
    
    // Calculate standard deviation for confidence intervals
    const variance = recentSales.reduce((sum, d) => sum + Math.pow(d.sales - avgSales, 2), 0) / windowSize;
    const stdDev = Math.sqrt(variance);
    
    // Get last month
    const lastMonth = new Date(sortedData[sortedData.length - 1].month + "-01");
    
    // Generate forecasts
    for (let i = 1; i <= forecastMonths; i++) {
      const forecastDate = new Date(lastMonth);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const forecastMonth = forecastDate.toISOString().slice(0, 7); // YYYY-MM format
      
      // Add slight growth trend (1% per month)
      const growthFactor = Math.pow(1.01, i);
      const forecastedSales = Math.round(avgSales * growthFactor);
      
      results.push({
        store,
        month: forecastMonth,
        forecastedSales,
        confidenceLow: Math.round(forecastedSales - 1.96 * stdDev),
        confidenceHigh: Math.round(forecastedSales + 1.96 * stdDev),
      });
    }
  });

  return results;
}

/**
 * Mock function to simulate reading sales data from a Lakehouse table
 * In a real implementation, this would use OneLake APIs or Lakehouse SQL endpoint

export async function readSalesDataFromLakehouse(
  lakehouseId: string,
  tableName: string
): Promise<SalesData[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
   */

//import { SalesData, ForecastResult } from "./SalesForecastItemDefinition";
import { FabricPlatformAPIClient } from "../../clients/FabricPlatformAPIClient";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import * as parquet from 'parquetjs';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ...existing code...

export async function readSalesDataFromLakehouse(
  lakehouseId: string,
  tableName: string,
  workloadClient: WorkloadClientAPI,
  workspaceId: string
): Promise<SalesData[]> {
  let tempFilePath: string | null = null;
  
  try {
    const fabricAPI = FabricPlatformAPIClient.create(workloadClient);
    
    // Create item wrapper for OneLake access
    const itemWrapper = fabricAPI.oneLakeStorage.createItemWrapper({
      id: lakehouseId,
      workspaceId: workspaceId
    });
    
    // Read parquet file from Views folder
    const filePath = `Views/${tableName}`;
    const base64Data = await itemWrapper.readFileAsBase64(filePath);
    
    // Convert base64 to Node.js Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Write to temporary file (parquetjs requires file path)
    tempFilePath = path.join(os.tmpdir(), `sales_data_${Date.now()}.parquet`);
    await fs.promises.writeFile(tempFilePath, buffer);
    
    // Parse parquet file
    const reader = await parquet.ParquetReader.openFile(tempFilePath);
    const cursor = reader.getCursor();
    const salesData: SalesData[] = [];
    
    let record = null;
    while (record = await cursor.next()) {
      salesData.push({
        store: String(record.store),
        month: String(record.month),
        sales: Number(record.sales)
      });
    }
    
    await reader.close();
    return salesData;
    
  } catch (error) {
    console.error('Failed to read sales data:', error);
    throw new Error(`Could not read table ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
    }
  }
}
  
  // Return mock data for demonstration
  // In production, you would use:
  // 1. OneLake REST APIs to read parquet files
  // 2. Lakehouse SQL endpoint to query tables
  // 3. Fabric API to execute queries
  
  const stores = ["Store_A", "Store_B", "Store_C"];
  const mockData: SalesData[] = [];
  
  // Generate 12 months of historical data
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  
  for (let month = 0; month < 12; month++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + month);
    const monthStr = date.toISOString().slice(0, 7);
    
    stores.forEach((store) => {
      // Generate realistic sales data with seasonality
      const baseSales = 50000 + Math.random() * 20000;
      const seasonality = Math.sin((month / 12) * 2 * Math.PI) * 10000;
      const sales = Math.round(baseSales + seasonality);
      
      mockData.push({
        store,
        month: monthStr,
        sales,
      });
    });
  }
  
  return mockData;
}

/**
 * Mock function to simulate writing forecast results to a Lakehouse table
 * In a real implementation, this would use OneLake APIs
 */
export async function writeForecastToLakehouse(
  lakehouseId: string,
  tableName: string,
  forecasts: ForecastResult[]
): Promise<void> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // In production, you would:
  // 1. Use OneLake createItemWrapper() for item-scoped operations
  // 2. Write data as parquet files to Tables folder
  // 3. Or use Lakehouse SQL endpoint to insert records
  
  console.log(`Writing ${forecasts.length} forecast records to ${tableName} in lakehouse ${lakehouseId}`);
  console.table(forecasts);
}
