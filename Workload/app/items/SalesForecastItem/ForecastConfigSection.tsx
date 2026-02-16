import React, { useState, useEffect } from "react";
import {
  Button,
  Field,
  Input,
  Dropdown,
  Option,
  Card,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  DatabaseArrowRight24Regular,
  Play24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { FabricPlatformAPIClient } from "../../clients/FabricPlatformAPIClient";
import { SalesForecastItemDefinition, ForecastResult } from "./SalesForecastItemDefinition";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXL,
  },
  configCard: {
    padding: tokens.spacingVerticalL,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  resultsCard: {
    padding: tokens.spacingVerticalL,
    marginTop: tokens.spacingVerticalL,
  },
  resultsTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: tokens.spacingVerticalM,
    "& th": {
      textAlign: "left",
      padding: tokens.spacingVerticalS,
      borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
      fontWeight: tokens.fontWeightSemibold,
    },
    "& td": {
      padding: tokens.spacingVerticalS,
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    },
  },
});

interface LakehouseItem {
  id: string;
  displayName: string;
}

interface ForecastConfigSectionProps {
  workloadClient: WorkloadClientAPI;
  workspaceId: string;
  definition: SalesForecastItemDefinition;
  onConfigChange: (updates: Partial<SalesForecastItemDefinition>) => void;
  onRunForecast: () => Promise<ForecastResult[]>;
}

export function ForecastConfigSection({
  workloadClient,
  workspaceId,
  definition,
  onConfigChange,
  onRunForecast,
}: ForecastConfigSectionProps) {
  const styles = useStyles();
  const [lakehouses, setLakehouses] = useState<LakehouseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ForecastResult[]>([]);

  useEffect(() => {
    loadLakehouses();
  }, [workspaceId]);

  const loadLakehouses = async () => {
    setLoading(true);
    try {
      // Fetch all Lakehouse items in the workspace using FabricPlatformAPIClient
      const fabricAPI = FabricPlatformAPIClient.create(workloadClient);
      const response = await fabricAPI.items.listItems(workspaceId, { type: "Lakehouse" });
      
      const lakehouseItems = response.value.map((item: any) => ({
        id: item.id,
        displayName: item.displayName,
      }));
      setLakehouses(lakehouseItems);
    } catch (error) {
      console.error("Failed to load lakehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunForecast = async () => {
    if (!definition.sourceLakehouseId || !definition.sourceTable) {
      alert("Please select a source lakehouse and table first");
      return;
    }

    setRunning(true);
    try {
      const forecastResults = await onRunForecast();
      setResults(forecastResults);
      onConfigChange({
        lastRunDate: new Date().toISOString(),
        lastRunStatus: "success",
        lastRunMessage: `Generated ${forecastResults.length} forecasts`,
      });
    } catch (error) {
      console.error("Forecast failed:", error);
      onConfigChange({
        lastRunDate: new Date().toISOString(),
        lastRunStatus: "error",
        lastRunMessage: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.configCard}>
        <Text size={500} weight="semibold">
          <Settings24Regular /> Forecast Configuration
        </Text>
        
        <div className={styles.fieldGroup}>
          <Field label="Source Lakehouse" required>
            <Dropdown
              placeholder="Select a lakehouse"
              value={definition.sourceLakehouseName || ""}
              selectedOptions={definition.sourceLakehouseId ? [definition.sourceLakehouseId] : []}
              onOptionSelect={(_, data) => {
                const selected = lakehouses.find((lh) => lh.id === data.optionValue);
                if (selected) {
                  onConfigChange({
                    sourceLakehouseId: selected.id,
                    sourceLakehouseName: selected.displayName,
                  });
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <Option>Loading...</Option>
              ) : (
                lakehouses.map((lh) => (
                  <Option key={lh.id} value={lh.id}>
                    {lh.displayName}
                  </Option>
                ))
              )}
            </Dropdown>
          </Field>

          <Field label="Source Table Name" required>
            <Input
              placeholder="e.g., sales_data"
              value={definition.sourceTable || ""}
              onChange={(_, data) => onConfigChange({ sourceTable: data.value })}
            />
          </Field>

          <Field label="Target Lakehouse">
            <Dropdown
              placeholder="Select a lakehouse (defaults to source)"
              value={definition.targetLakehouseName || definition.sourceLakehouseName || ""}
              selectedOptions={
                definition.targetLakehouseId
                  ? [definition.targetLakehouseId]
                  : definition.sourceLakehouseId
                  ? [definition.sourceLakehouseId]
                  : []
              }
              onOptionSelect={(_, data) => {
                const selected = lakehouses.find((lh) => lh.id === data.optionValue);
                if (selected) {
                  onConfigChange({
                    targetLakehouseId: selected.id,
                    targetLakehouseName: selected.displayName,
                  });
                }
              }}
              disabled={loading}
            >
              {lakehouses.map((lh) => (
                <Option key={lh.id} value={lh.id}>
                  {lh.displayName}
                </Option>
              ))}
            </Dropdown>
          </Field>

          <Field label="Target Table Name">
            <Input
              placeholder="e.g., sales_forecast (defaults to source_forecast)"
              value={definition.targetTable || ""}
              onChange={(_, data) => onConfigChange({ targetTable: data.value })}
            />
          </Field>

          <Field label="Forecast Months">
            <Input
              type="number"
              value={definition.forecastMonths?.toString() || "3"}
              onChange={(_, data) => onConfigChange({ forecastMonths: parseInt(data.value) || 3 })}
              min={1}
              max={12}
            />
          </Field>

          <Button
            appearance="primary"
            icon={<Play24Regular />}
            onClick={handleRunForecast}
            disabled={running || !definition.sourceLakehouseId || !definition.sourceTable}
          >
            {running ? "Running Forecast..." : "Run Forecast"}
          </Button>
        </div>
      </Card>

      {definition.lastRunDate && (
        <Card>
          <Text size={400}>
            <strong>Last Run:</strong> {new Date(definition.lastRunDate).toLocaleString()}
            {" | "}
            <strong>Status:</strong> {definition.lastRunStatus}
          </Text>
          {definition.lastRunMessage && <Text size={300}>{definition.lastRunMessage}</Text>}
        </Card>
      )}

      {running && (
        <Card>
          <Spinner label="Generating forecasts..." />
        </Card>
      )}

      {results.length > 0 && (
        <Card className={styles.resultsCard}>
          <Text size={500} weight="semibold">
            <DatabaseArrowRight24Regular /> Forecast Results
          </Text>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>Store</th>
                <th>Month</th>
                <th>Forecasted Sales</th>
                <th>Confidence Range</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr key={idx}>
                  <td>{result.store}</td>
                  <td>{result.month}</td>
                  <td>${result.forecastedSales.toLocaleString()}</td>
                  <td>
                    {result.confidenceLow && result.confidenceHigh
                      ? `$${result.confidenceLow.toLocaleString()} - $${result.confidenceHigh.toLocaleString()}`
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
