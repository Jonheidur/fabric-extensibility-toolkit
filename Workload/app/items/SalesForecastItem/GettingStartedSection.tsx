import React from "react";
import { Link } from "@fluentui/react-components";
import { Open16Regular } from "@fluentui/react-icons";
import "./SalesForecastItem.scss";

interface GettingStartedSectionProps {
  onOpenResource: (url: string) => void;
}

export function GettingStartedSection({ onOpenResource }: GettingStartedSectionProps) {

  return (
    <div className="hello-world-view">
      <div className="hello-world-next">
        <div className="hello-world-section-header">
          <h2 className="hello-world-section-title">Getting Started</h2>
          <p className="hello-world-section-subtitle">
            Configure your sales forecast to predict future sales based on historical data.
          </p>
        </div>
        <div className="hello-world-section-body">
          <ol className="hello-world-next-list">
            <li className="hello-world-next-item">
              <strong>Select a source Lakehouse</strong> that contains your historical sales data.
            </li>
            <li className="hello-world-next-item">
              <strong>Specify the table name</strong> with sales data (columns: store, month, sales).
            </li>
            <li className="hello-world-next-item">
              <strong>Choose forecast months</strong> (default: 3 months ahead).
            </li>
            <li className="hello-world-next-item">
              <strong>Run the forecast</strong> to generate predictions.
            </li>
            <li className="hello-world-next-item">
              <strong>Save the configuration</strong> to persist your settings.
            </li>
          </ol>
        </div>
        <hr className="hello-world-separator-line" />
        <div className="hello-world-section-header">
          <h2 className="hello-world-section-title">How It Works</h2>
        </div>
        <div className="hello-world-section-body">
          <ul className="hello-world-next-list">
            <li className="hello-world-next-item">
              Reads historical sales data from your Lakehouse table
            </li>
            <li className="hello-world-next-item">
              Applies moving average algorithm with trend analysis
            </li>
            <li className="hello-world-next-item">
              Generates forecasts per store for the specified months
            </li>
            <li className="hello-world-next-item">
              Writes results back to a Lakehouse table with confidence intervals
            </li>
          </ul>
        </div>
        <hr className="hello-world-separator-line" />
        <div className="hello-world-section-header">
          <h2 className="hello-world-section-title">Learn More</h2>
        </div>
        <div className="hello-world-section-body">
          <div className="hello-world-step-button">
            <Link onClick={() => onOpenResource("https://aka.ms/fabric-item-development-guide")}>
              Fabric Item Development Guide
              <Open16Regular style={{ marginLeft: '4px' }} />
            </Link>
          </div>
          <div className="hello-world-step-button">
            <Link onClick={() => onOpenResource("https://learn.microsoft.com/fabric/onelake/onelake-overview")}>
              OneLake Documentation
              <Open16Regular style={{ marginLeft: '4px' }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
