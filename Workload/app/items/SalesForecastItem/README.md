# Sales Forecast Item - Understanding Fabric Workload Integration

## Overview
The **Sales Forecast Item** demonstrates how custom Fabric workloads integrate with existing Fabric items (like Lakehouses) to create powerful, domain-specific analytics solutions.

## What This Item Does

1. **Reads** historical sales data from a **Lakehouse table**
2. **Analyzes** sales patterns per store and month
3. **Generates** forecasts for the next 3 months using moving average algorithm
4. **Writes** forecast results back to a Lakehouse table with confidence intervals

## How Custom Items Integrate with Fabric

### ✅ **This IS What Workloads Are For**

Your sales forecasting example is a **perfect use case** for Fabric workloads because it:

- **Extends Fabric's analytics capabilities** with domain-specific forecasting logic
- **Integrates seamlessly** with existing Fabric items (Lakehouses, Warehouses, Notebooks)
- **Provides a specialized UI** for a specific business task (sales forecasting)
- **Leverages OneLake** for data storage and sharing
- **Follows Fabric's security model** (workspace-level permissions, authentication)

### 🔗 **How Items Reference Other Fabric Items**

Custom items can interact with existing Fabric items in several ways:

#### **1. Item Discovery (Implemented in Sales Forecast)**
```typescript
// List all Lakehouse items in the current workspace
const items = await callItemsListInWorkspace(workloadClient, workspaceId);
const lakehouses = items.filter((item) => item.type === "Lakehouse");
```

#### **2. OneLake Data Access**
```typescript
// Read from Lakehouse tables via OneLake APIs
const oneLakeClient = new OneLakeStorageClient(workloadClient);
const itemWrapper = oneLakeClient.createItemWrapper({
  id: lakehouseId,
  workspaceId: workspaceId
});

// Read parquet files from Tables folder
const tableData = await itemWrapper.readFile(`Tables/${tableName}`);
```

#### **3. Item References in Configuration**
Your Sales Forecast item **stores references** to Lakehouse items:
```typescript
export interface SalesForecastItemDefinition {
  sourceLakehouseId?: string;      // Reference to source Lakehouse
  sourceLakehouseName?: string;    // Display name
  targetLakehouseId?: string;      // Reference to target Lakehouse
  // ... other config
}
```

#### **4. Cross-Item Workflows**
Custom items can:
- Trigger **Pipeline** executions
- Query **Warehouse** tables
- Launch **Notebooks** for data processing
- Open other items using `callNavigationOpenItem()`

## Architecture Pattern: Configuration + Execution

### **Configuration Phase**
1. User selects source/target Lakehouses via dropdown
2. Specifies table names and forecast parameters
3. Configuration saved to item definition

### **Execution Phase**
1. "Run Forecast" button triggers analysis
2. Reads data from configured Lakehouse
3. Applies forecast algorithm
4. Writes results to target Lakehouse
5. Displays results in UI

## Key Features Demonstrated

### ✅ **Lakehouse Integration**
- Lists available Lakehouses in workspace
- Reads historical data (simulated in demo)
- Writes forecast results (simulated in demo)

### ✅ **Workspace-Aware**
- Only shows items from current workspace
- Respects Fabric permissions
- Uses workspace-level security context

### ✅ **State Persistence**
- Configuration saved to Fabric item definition
- Last run status tracked
- Can be reopened and reconfigured later

### ✅ **Professional UI**
- Fluent UI components (v9)
- ItemEditor with left/center panels
- Empty state for first-time users
- Results table with confidence intervals

## Real-World Implementation Notes

### **🔧 To Make This Production-Ready:**

1. **Replace Mock Data Functions**
   - Current: `readSalesDataFromLakehouse()` returns mock data
   - Production: Use OneLake APIs or Lakehouse SQL endpoint

2. **Implement Real OneLake I/O**
   ```typescript
   // Example: Real OneLake read
   const itemWrapper = oneLakeClient.createItemWrapper({
     id: lakehouseId,
     workspaceId: workspaceId
   });
   const fileStream = await itemWrapper.readFile(`Tables/${tableName}/data.parquet`);
   ```

3. **Add Advanced Forecasting**
   - Current: Simple moving average
   - Enhancement: Exponential smoothing, ARIMA, Prophet, etc.
   - Could call external ML APIs or Python notebooks

4. **Add Data Validation**
   - Verify table schema (columns: store, month, sales)
   - Handle missing data gracefully
   - Add date range filters

## Example Scenarios

### **Retail Analytics**
- Source: Sales transactions in Lakehouse
- Output: Store-level forecasts for inventory planning

### **Finance**
- Source: Historical revenue data
- Output: Quarterly revenue projections

### **Supply Chain**
- Source: Product demand history
- Output: Procurement forecasts per supplier

## File Structure

```
SalesForecastItem/
├── SalesForecastItemDefinition.ts    # Data models & interfaces
├── SalesForecastItemEditor.tsx       # Main editor orchestrator
├── SalesForecastItemDefaultView.tsx  # Main view layout
├── SalesForecastItemEmptyView.tsx    # First-time user experience
├── SalesForecastItemRibbon.tsx       # Toolbar actions (Save, Settings)
├── ForecastConfigSection.tsx         # Configuration UI
├── ForecastEngine.ts                 # Forecast algorithm & I/O
├── GettingStartedSection.tsx         # Left panel guidance
└── SalesForecastItem.scss            # Styles
```

## Testing the Item

1. **Start your dev environment**
   ```bash
   pwsh scripts/Run/StartDevServer.ps1
   pwsh scripts/Run/StartDevGateway.ps1
   ```

2. **Create a Sales Forecast item**
   - Navigate to Fabric workload hub
   - Find your workload in developer mode
   - Create a "Sales Forecast" item

3. **Configure and run**
   - Select a Lakehouse from the dropdown
   - Enter table name (e.g., "sales_data")
   - Click "Run Forecast"
   - View results in table

## Benefits of This Approach

✅ **No context switching** - Users stay in Fabric portal  
✅ **Shared security model** - Workspace permissions apply  
✅ **OneLake integration** - Leverage existing data infrastructure  
✅ **Discoverable** - Appears alongside native Fabric items  
✅ **Reusable** - Same Lakehouse can feed multiple analyses  

## Next Steps

- **Add more forecast algorithms** (exponential smoothing, seasonal models)
- **Implement real OneLake I/O** using production APIs
- **Add data visualization** (charts showing historical + forecast trends)
- **Schedule automatic runs** using Job Scheduler API
- **Export results** to Power BI for reporting

---

**This demonstrates the power of Fabric extensibility: creating specialized, integrated analytics tools that feel native to the platform!**
