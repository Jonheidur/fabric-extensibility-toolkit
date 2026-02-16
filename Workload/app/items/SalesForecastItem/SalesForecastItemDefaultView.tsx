import React from "react";
import { useTranslation } from "react-i18next";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { callNavigationOpenInNewBrowserTab } from "../../controller/NavigationController";
import { SalesForecastItemDefinition, ForecastResult } from "./SalesForecastItemDefinition";
import { ItemEditorDefaultView } from "../../components/ItemEditor";
import { GettingStartedSection } from "./GettingStartedSection";
import { ForecastConfigSection } from "./ForecastConfigSection";
import { generateForecast, readSalesDataFromLakehouse, writeForecastToLakehouse } from "./ForecastEngine";
import "./SalesForecastItem.scss";

interface SalesForecastItemDefaultViewProps {
  workloadClient: WorkloadClientAPI;
  item?: ItemWithDefinition<SalesForecastItemDefinition>;
  currentDefinition: SalesForecastItemDefinition;
  onDefinitionChange?: (updates: Partial<SalesForecastItemDefinition>) => void;
}

export function SalesForecastItemDefaultView({
  workloadClient,
  item,
  currentDefinition,
  onDefinitionChange,
}: SalesForecastItemDefaultViewProps) {
  const { t } = useTranslation();

  const handleOpenResource = async (url: string) => {
    try {
      // Demonstrate external navigation API
      await callNavigationOpenInNewBrowserTab(workloadClient, url);
    } catch (error) {
      // Log the error
      console.error('Failed to open resource via Fabric navigation API:', error);
    }
  };

  const handleRunForecast = async (): Promise<ForecastResult[]> => {
    if (!item?.definition) {
      throw new Error("Item definition not loaded");
    }

    const { sourceLakehouseId, sourceTable, targetLakehouseId, targetTable, forecastMonths } = item.definition;
    
    if (!sourceLakehouseId || !sourceTable) {
      throw new Error("Source lakehouse and table are required");
    }

    // Read historical sales data
    const historicalData = await readSalesDataFromLakehouse(sourceLakehouseId, sourceTable);
    
    // Generate forecasts
    const forecasts = generateForecast(historicalData, forecastMonths || 3);
    
    // Write to target lakehouse (defaults to source)
    const targetLakehouse = targetLakehouseId || sourceLakehouseId;
    const targetTableName = targetTable || `${sourceTable}_forecast`;
    await writeForecastToLakehouse(targetLakehouse, targetTableName, forecasts);
    
    return forecasts;
  };

  return (
    <ItemEditorDefaultView
      //Add left control if you want to split the center content in the editor
      left={{
        content: <GettingStartedSection onOpenResource={handleOpenResource} />,
        width: 380,
        minWidth: 350,
        title: t('Item_GettingStarted_Label', 'Getting Started'),
        enableUserResize: true,
        collapsible: true
      }}
      center={{
         content: (
          <ForecastConfigSection
            workloadClient={workloadClient}
            workspaceId={item?.workspaceId || ""}
            definition={currentDefinition}
            onConfigChange={(updates) => onDefinitionChange?.(updates)}
            onRunForecast={handleRunForecast}
          />
        )
      }}
    />
  );
}
