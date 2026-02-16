import React from "react";
import { useTranslation } from "react-i18next";

import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { SalesForecastItemDefinition } from "./SalesForecastItemDefinition";
import { ItemEditorEmptyView, EmptyStateTask } from "../../components/ItemEditor";
import "./SalesForecastItem.scss";

interface SalesForecastItemEmptyViewProps {
  workloadClient: WorkloadClientAPI;
  item?: ItemWithDefinition<SalesForecastItemDefinition>;
  onNavigateToGettingStarted: () => void;
}

/**
 * Empty state component - the first screen users see
 * This is a static page that can be easily removed or replaced by developers
 * 
 * To skip this page, modify SalesForecastItemEditor.tsx line 25,55
 * to always set currentView to 'getting-started'
 * 
 * This component uses the ItemEditorEmptyView control for consistency
 * across all item types.
 */
export function SalesForecastItemEmptyView({
  workloadClient,
  item,
  onNavigateToGettingStarted
}: SalesForecastItemEmptyViewProps) {
  const { t } = useTranslation();

  // Define onboarding tasks
  const tasks: EmptyStateTask[] = [
    {
      id: 'getting-started',
      label: t('SalesForecastItemEmptyView_StartButton', 'Getting Started'),
      icon: undefined,
      description: t('SalesForecastItemEmptyView_StartButton_Description', 'Learn how to set up your SalesForecast item.'),
      onClick: onNavigateToGettingStarted,
    }
  ];

  return (
    <ItemEditorEmptyView
      title={t('SalesForecastItemEmptyView_Title', 'Welcome to SalesForecast!')}
      description={t('SalesForecastItemEmptyView_Description', 'This is the first screen people will see after an item is created. Include some basic information to help them continue.')}
      imageSrc="/assets/items/SalesForecastItem/EditorEmpty.svg"
      imageAlt="Empty state illustration"
      tasks={tasks}
    />
  );
}
