
export const ReportService = {
  async getUserChartData() {
    const response = await fetch("/api/report/users", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to load user chart data.");
    }

    return response.json() as Promise<{
      labels: string[];
      data: number[];
    }>;
  },

};

