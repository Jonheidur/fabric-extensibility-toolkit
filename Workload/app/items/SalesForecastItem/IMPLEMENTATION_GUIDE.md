# Real Data Implementation Guide for Sales Forecast

## Current Mock Functions

The mock data functions are located in `ForecastEngine.ts`:
- **Line ~65**: `readSalesDataFromLakehouse()` - Generates fake data
- **Line ~112**: `writeForecastToLakehouse()` - Logs to console

## Option 1: OneLake REST API (Direct File Access)

Replace the mock `readSalesDataFromLakehouse()` function:

```typescript
import { FabricPlatformAPIClient } from "../../clients/FabricPlatformAPIClient";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import * as parquet from 'parquetjs'; // You'll need: npm install parquetjs

export async function readSalesDataFromLakehouse(
  lakehouseId: string,
  tableName: string,
  workloadClient: WorkloadClientAPI,
  workspaceId: string
): Promise<SalesData[]> {
  try {
    const fabricAPI = FabricPlatformAPIClient.create(workloadClient);
    
    // Create item wrapper for OneLake access
    const itemWrapper = fabricAPI.oneLakeStorage.createItemWrapper({
      id: lakehouseId,
      workspaceId: workspaceId
    });
    
    // Read parquet file from Tables folder
    const filePath = `Tables/${tableName}`;
    const fileBuffer = await itemWrapper.readFile(filePath);
    
    // Parse parquet file
    const reader = await parquet.ParquetReader.openBuffer(fileBuffer);
    const cursor = reader.getCursor();
    const salesData: SalesData[] = [];
    
    let record = null;
    while (record = await cursor.next()) {
      salesData.push({
        store: record.store,
        month: record.month,
        sales: record.sales
      });
    }
    
    await reader.close();
    return salesData;
    
  } catch (error) {
    console.error('Failed to read sales data:', error);
    throw new Error(`Could not read table ${tableName}: ${error.message}`);
  }
}
```

Replace the mock `writeForecastToLakehouse()` function:

```typescript
export async function writeForecastToLakehouse(
  lakehouseId: string,
  tableName: string,
  forecasts: ForecastResult[],
  workloadClient: WorkloadClientAPI,
  workspaceId: string
): Promise<void> {
  try {
    const fabricAPI = FabricPlatformAPIClient.create(workloadClient);
    
    const itemWrapper = fabricAPI.oneLakeStorage.createItemWrapper({
      id: lakehouseId,
      workspaceId: workspaceId
    });
    
    // Define parquet schema
    const schema = new parquet.ParquetSchema({
      store: { type: 'UTF8' },
      month: { type: 'UTF8' },
      forecastedSales: { type: 'INT32' },
      confidenceLow: { type: 'INT32', optional: true },
      confidenceHigh: { type: 'INT32', optional: true }
    });
    
    // Write parquet file
    const writer = await parquet.ParquetWriter.openBuffer(schema);
    for (const forecast of forecasts) {
      await writer.appendRow(forecast);
    }
    await writer.close();
    
    const buffer = writer.getBuffer();
    const filePath = `Tables/${tableName}/forecast_${Date.now()}.parquet`;
    await itemWrapper.writeFile(filePath, buffer);
    
  } catch (error) {
    console.error('Failed to write forecast data:', error);
    throw new Error(`Could not write to table ${tableName}: ${error.message}`);
  }
}
```

## Option 2: Lakehouse SQL Endpoint (Query Tables)

```typescript
import { FabricPlatformAPIClient } from "../../clients/FabricPlatformAPIClient";

export async function readSalesDataFromLakehouse(
  lakehouseId: string,
  tableName: string,
  workloadClient: WorkloadClientAPI
): Promise<SalesData[]> {
  try {
    const fabricAPI = FabricPlatformAPIClient.create(workloadClient);
    
    // Get lakehouse SQL endpoint
    const lakehouse = await fabricAPI.items.getItem(workspaceId, lakehouseId);
    const sqlEndpoint = lakehouse.properties?.sqlEndpointProperties?.connectionString;
    
    if (!sqlEndpoint) {
      throw new Error('Lakehouse SQL endpoint not available');
    }
    
    // Execute SQL query (you'll need to implement SQL execution)
    const query = `SELECT store, month, sales FROM ${tableName} ORDER BY month`;
    const results = await executeSQLQuery(sqlEndpoint, query);
    
    return results.map(row => ({
      store: row.store,
      month: row.month,
      sales: row.sales
    }));
    
  } catch (error) {
    console.error('Failed to query sales data:', error);
    throw new Error(`Could not query table ${tableName}: ${error.message}`);
  }
}
```

## Option 3: Spark Job (For Complex Processing)

```typescript
import { FabricPlatformAPIClient } from "../../clients/FabricPlatformAPIClient";

export async function readSalesDataFromLakehouse(
  lakehouseId: string,
  tableName: string,
  workloadClient: WorkloadClientAPI,
  workspaceId: string
): Promise<SalesData[]> {
  try {
    const fabricAPI = FabricPlatformAPIClient.create(workloadClient);
    
    // Submit Spark job to read data
    const sparkCode = `
      df = spark.read.table("${tableName}")
      df.select("store", "month", "sales").toPandas().to_json(orient='records')
    `;
    
    const job = await fabricAPI.spark.submitSparkJob(workspaceId, lakehouseId, {
      code: sparkCode,
      language: 'python'
    });
    
    // Wait for job completion
    const result = await fabricAPI.spark.waitForJobCompletion(job.id);
    
    return JSON.parse(result.output);
    
  } catch (error) {
    console.error('Failed to execute Spark job:', error);
    throw new Error(`Spark job failed: ${error.message}`);
  }
}
```

## Required Updates in DefaultView

Update the `handleRunForecast` function to pass additional parameters:

```typescript
const handleRunForecast = async (): Promise<ForecastResult[]> => {
  if (!item?.definition) {
    throw new Error("Item definition not loaded");
  }

  const { sourceLakehouseId, sourceTable, targetLakehouseId, targetTable, forecastMonths } = item.definition;
  
  if (!sourceLakehouseId || !sourceTable) {
    throw new Error("Source lakehouse and table are required");
  }

  // Pass workloadClient and workspaceId to real functions
  const historicalData = await readSalesDataFromLakehouse(
    sourceLakehouseId, 
    sourceTable,
    workloadClient,  // ADD THIS
    item.workspaceId  // ADD THIS
  );
  
  const forecasts = generateForecast(historicalData, forecastMonths || 3);
  
  const targetLakehouse = targetLakehouseId || sourceLakehouseId;
  const targetTableName = targetTable || `${sourceTable}_forecast`;
  
  await writeForecastToLakehouse(
    targetLakehouse, 
    targetTableName, 
    forecasts,
    workloadClient,  // ADD THIS
    item.workspaceId  // ADD THIS
  );
  
  return forecasts;
};
```

## Expected Data Schema

Your Lakehouse table should have these columns:

```sql
CREATE TABLE sales_data (
    store STRING,
    month STRING,      -- Format: 'YYYY-MM' (e.g., '2025-01')
    sales INT
)
```

Example data:
```
store     | month    | sales
----------|----------|--------
Store_A   | 2025-01  | 52000
Store_A   | 2025-02  | 48000
Store_B   | 2025-01  | 61000
...
```

## Testing

1. Create a test Lakehouse in your workspace
2. Create a table with sample data using Spark:
   ```python
   data = [
       ("Store_A", "2025-01", 52000),
       ("Store_A", "2025-02", 48000),
       ("Store_B", "2025-01", 61000)
   ]
   df = spark.createDataFrame(data, ["store", "month", "sales"])
   df.write.mode("overwrite").saveAsTable("sales_data")
   ```
3. Select that Lakehouse in your Sales Forecast item
4. Run the forecast

## Next Steps

1. Choose your implementation approach (OneLake API recommended)
2. Install required packages if needed: `npm install parquetjs`
3. Update function signatures in `ForecastEngine.ts`
4. Update calls in `SalesForecastItemDefaultView.tsx`
5. Test with real Lakehouse data
