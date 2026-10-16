"use client";

import { useEffect, useState } from "react";

import { Chart } from "primereact/chart";
import { Panel } from "primereact/panel";

import { ReportService } from "@/services/ReportService";
import "../app/globals.css";

interface ReportChartProps {
  title?: string;
}

type UserChartData = {
  labels: string[];
  data: number[];
};

export default function ReportChart({
  title = "User Report",
}: ReportChartProps) {
  const [mounted, setMounted] = useState(false);

  const [chartData, setChartData] = useState<UserChartData | null>(null);

  const [options, setOptions] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadUserReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await ReportService.getUserChartData();

        if (!active) {
          return;
        }

        const style = getComputedStyle(document.documentElement);

        const secondary =
          style.getPropertyValue("--text-color-secondary").trim() || "#64748b";

        const border =
          style.getPropertyValue("--surface-border").trim() || "#e2e8f0";

        setChartData({
          labels: data.labels,
          data: data.data,
        });

        setOptions({
          responsive: true,

          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false,
            },

            tooltip: {
              callbacks: {
                label: (context: any) => {
                  return ` Users: ${context.raw}`;
                },
              },
            },
          },

          scales: {
            x: {
              ticks: {
                color: secondary,
              },

              grid: {
                display: false,
              },
            },

            y: {
              beginAtZero: true,

              ticks: {
                color: secondary,
                precision: 0,
                stepSize: 1,
              },

              grid: {
                color: border,
              },
            },
          },
        });

        setMounted(true);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Could not load user data.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadUserReport();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page report-page">
      <div className="header">
        <div className="header-title">
          <h1 className="title">{title}</h1>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        <Panel
          header="Users Chart"
          toggleable
          className="dashboard-chart-panel"
        >
          <div className="dashboard-chart">
            {loading && (
              <div className="permission-loading">
                <i className="pi pi-spin pi-spinner text-2xl" />
              </div>
            )}

            {!loading && error && (
              <div className="p-3 text-red-500">{error}</div>
            )}

            {!loading && !error && mounted && chartData && options && (
              <Chart
                type="bar"
                data={{
                  labels: chartData.labels,

                  datasets: [
                    {
                      label: "Users",

                      data: chartData.data,

                      backgroundColor: "#8ecac5",

                      borderColor: "#161a19",

                      borderWidth: 1,

                      borderRadius: 5,
                      barPercentage: 0.45,
                      categoryPercentage: 0.7,
                    },
                  ],
                }}
                options={options}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
