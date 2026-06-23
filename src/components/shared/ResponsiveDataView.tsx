import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "./EmptyState";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveDataViewProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  cardRender?: (item: T) => React.ReactNode;
}

export function ResponsiveDataView<T>({
  data,
  columns,
  keyExtractor,
  emptyTitle = "No data found",
  emptyDescription = "There are no records to display at this time.",
  onRowClick,
  cardRender
}: ResponsiveDataViewProps<T>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  // Mobile View
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {data.map((item) => (
          <Card 
            key={keyExtractor(item)} 
            className={`overflow-hidden ${onRowClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4 sm:p-5">
              {cardRender ? (
                cardRender(item)
              ) : (
                <div className="space-y-2">
                  {columns.filter(c => !c.hideOnMobile).map((col, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <span className="text-xs text-muted-foreground font-medium">{col.header}</span>
                      <span className="text-sm font-medium text-right break-words max-w-[60%]">
                        {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop View
  return (
    <div className="rounded-md border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow className="hover:bg-transparent">
              {columns.map((col, idx) => (
                <TableHead key={idx} className={`whitespace-nowrap font-semibold ${col.className || ""}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow 
                key={keyExtractor(item)} 
                className={`${onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, idx) => (
                  <TableCell key={idx} className={col.className || ""}>
                    {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
