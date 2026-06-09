"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href="/api/export/history.xlsx" download>
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href="/api/export/history.csv" download>
          <FileText className="h-4 w-4" /> CSV
        </a>
      </Button>
    </div>
  );
}
