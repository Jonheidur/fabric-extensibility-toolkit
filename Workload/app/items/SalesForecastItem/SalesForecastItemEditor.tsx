import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody
} from "@fluentui/react-components";
import { NotificationType } from "@ms-fabric/workload-client";
import {
  Dismiss20Regular,
  Warning20Filled
} from "@fluentui/react-icons";
import { PageProps, ContextProps } from "../../App";
import { ItemWithDefinition, getWorkloadItem, callGetItem, saveWorkloadItem } from "../../controller/ItemCRUDController";
import { callOpenSettings } from "../../controller/SettingsController";
import { callNotificationOpen } from "../../controller/NotificationController";
import { ItemEditor, useViewNavigation, RegisteredNotification } from "../../components/ItemEditor";
import { SalesForecastItemDefinition } from "./SalesForecastItemDefinition";
import { SalesForecastItemEmptyView } from "./SalesForecastItemEmptyView";
import { SalesForecastItemDefaultView } from "./SalesForecastItemDefaultView";
import { SalesForecastItemRibbon } from "./SalesForecastItemRibbon";
import "./SalesForecastItem.scss";

/**
 * Different views that are available for the SalesForecast item
 */
export const EDITOR_VIEW_TYPES = {
  EMPTY: 'empty',
  DEFAULT: 'default',
} as const;

const enum SaveStatus {
  NotSaved = 'NotSaved',
  Saving = 'Saving',
  Saved = 'Saved'
}


export function SalesForecastItemEditor(props: PageProps) {
  const { workloadClient } = props;
  const pageContext = useParams<ContextProps>();
  const { t } = useTranslation();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemWithDefinition<SalesForecastItemDefinition>>();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NotSaved);
  const [currentDefinition, setCurrentDefinition] = useState<SalesForecastItemDefinition>({});
  // Set to true if you want to see the messageBar content in the editor
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [viewSetter, setViewSetter] = useState<((view: string) => void) | null>(null);

  const { pathname } = useLocation();

  async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
    // Prevent unnecessary reload if the same item is already loaded
    if (pageContext.itemObjectId && item && item.id === pageContext.itemObjectId) {
      console.log(`Item ${pageContext.itemObjectId} is already loaded, skipping reload`);
      return;
    }

    setIsLoading(true);
    var LoadedItem: ItemWithDefinition<SalesForecastItemDefinition> = undefined;
    if (pageContext.itemObjectId) {
      // for Edit scenario we get the itemObjectId and then load the item via the workloadClient SDK
      try {
        LoadedItem = await getWorkloadItem<SalesForecastItemDefinition>(
          workloadClient,
          pageContext.itemObjectId,
        );

        // Ensure item definition is properly initialized without mutation
        if (!LoadedItem.definition) {
          setSaveStatus(SaveStatus.NotSaved);
          LoadedItem = {
            ...LoadedItem,
            definition: {
              forecastMonths: 3,
            }
          };
        }
        else {
          setSaveStatus(SaveStatus.Saved);
          console.log('LoadedItem definition: ', LoadedItem.definition);
        }

        // Initialize the item
        setItem(LoadedItem);
        
        // Initialize current definition
        setCurrentDefinition(LoadedItem.definition || {});

      } catch (error) {
        setItem(undefined);
      }
    } else {
      console.log(`non-editor context. Current Path: ${pathname}`);
    }
    setIsLoading(false);
  }


  useEffect(() => {
    loadDataFromUrl(pageContext, pathname);
  }, [pageContext, pathname]);

  const handleOpenSettings = async () => {
    if (item) {
      try {
        const item_res = await callGetItem(workloadClient, item.id);
        await callOpenSettings(workloadClient, item_res.item, 'About');
      } catch (error) {
        console.error('Failed to open settings:', error);
      }
    }
  };

  async function saveItem() {
    setSaveStatus(SaveStatus.Saving);
    item.definition = {
      ...currentDefinition
    }
    setCurrentDefinition(item.definition)

    let successResult;
    let errorMessage = "";

    try {
      successResult = await saveWorkloadItem<SalesForecastItemDefinition>(
        workloadClient,
        item,
      );
    } catch (error) {
      errorMessage = error?.message;
    }

    const wasSaved = Boolean(successResult);

    if (wasSaved) {
      setSaveStatus(SaveStatus.Saved);
      // Update the item with saved definition
      setItem(prev => ({ ...prev, definition: item.definition }));
      callNotificationOpen(
        props.workloadClient,
        t("ItemEditor_Saved_Notification_Title"),
        t("ItemEditor_Saved_Notification_Text", { itemName: item.displayName }),
        undefined,
        undefined
      );
    } else {
      setSaveStatus(SaveStatus.NotSaved);
      const failureMessage = errorMessage
        ? `${t("ItemEditor_SaveFailed_Notification_Text", { itemName: item.displayName })} ${errorMessage}.`
        : t("ItemEditor_SaveFailed_Notification_Text", { itemName: item.displayName });
        
      callNotificationOpen(
        props.workloadClient,
        t("ItemEditor_SaveFailed_Notification_Title"),
        failureMessage,
        NotificationType.Error,
        undefined
      );
    }
  }

  // Check if Save should be enabled
  const isSaveEnabled = (currentView: string) => {
    if (currentView === EDITOR_VIEW_TYPES.EMPTY) {
      return false;
    }
    // Enable save if definition has changed
    return saveStatus === SaveStatus.NotSaved;
  };

  // Wrapper component for empty view that uses navigation hook
  const EmptyViewWrapper = () => {
    const { setCurrentView } = useViewNavigation();
    
    return (
      <SalesForecastItemEmptyView
        workloadClient={workloadClient}
        item={item}
        onNavigateToGettingStarted={() => {
          setCurrentDefinition(prev => ({ ...prev, forecastMonths: 3 }));
          setSaveStatus(SaveStatus.NotSaved);
          setCurrentView(EDITOR_VIEW_TYPES.DEFAULT);
        }}
      />
    );
  };

  // Handle definition changes
  const handleDefinitionChange = (updates: Partial<SalesForecastItemDefinition>) => {
    setCurrentDefinition(prev => ({ ...prev, ...updates }));
    setSaveStatus(SaveStatus.NotSaved);
  };

  // Static view definitions - no function wrapper needed!
  const views = [
    {
      name: EDITOR_VIEW_TYPES.EMPTY,
      component: <EmptyViewWrapper />
    },
    {
      name: EDITOR_VIEW_TYPES.DEFAULT,
      component: (
      <SalesForecastItemDefaultView
        workloadClient={workloadClient}
        item={item}
        currentDefinition={currentDefinition}
        onDefinitionChange={handleDefinitionChange}
      />
    )
    }
  ];

  // Effect to set the correct view after loading completes
  useEffect(() => {
    if (!isLoading && item && viewSetter) {
      // Determine the correct view based on item state
      const correctView = !item?.definition?.sourceLakehouseId ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT;   
      viewSetter(correctView);
    }
  }, [isLoading, item, viewSetter]);


  // Static notification definitions - like views!
  const notifications: RegisteredNotification[] = [
    {
      name: 'default-warning',
      showInViews: [EDITOR_VIEW_TYPES.DEFAULT], // Only show in DEFAULT view
      component: showWarning ? (
        <MessageBar intent="warning" icon={<Warning20Filled />}>
          <MessageBarBody>
            {t('GettingStarted_Warning', 'You can delete or modify the content on this page at any time.')}
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <Button
                appearance="transparent"
                icon={<Dismiss20Regular />}
                aria-label={t('MessageBar_Dismiss', 'Dismiss')}
                onClick={() => setShowWarning(false)}
              />
            }
          />
        </MessageBar>
      ) : null
    }
  ];

  return (
    <ItemEditor
      isLoading={isLoading}
      loadingMessage={t("SalesForecastItemEditor_Loading", "Loading item...")}
      ribbon={(context) => (
        <SalesForecastItemRibbon
          {...props}
          viewContext={context}
          isSaveButtonEnabled={isSaveEnabled(context.currentView)}
          saveItemCallback={saveItem}
          openSettingsCallback={handleOpenSettings}
        />
      )}
      messageBar={notifications}
      views={views}
      viewSetter={(setCurrentView) => {
        // Store the setCurrentView function so we can use it after loading
        if (!viewSetter) {
          setViewSetter(() => setCurrentView);
        }
      }}
    />
  );
}
