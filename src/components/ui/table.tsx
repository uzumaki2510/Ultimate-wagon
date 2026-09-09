import * as React from "react";

import { cn } from "@/lib/utils";

function plainText(node: React.ReactNode): string {
  return React.Children.toArray(node).map(child => typeof child === "string" || typeof child === "number" ? String(child) : React.isValidElement<{ children?: React.ReactNode; colSpan?: number }>(child) ? plainText(child.props.children) : "").join("");
}
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement> & { mobileCards?: boolean }>(
  ({ className, children, mobileCards = false, ...props }, ref) => {
    const groups = React.Children.toArray(children);
    const header = groups.find(child => React.isValidElement<{ children?: React.ReactNode; colSpan?: number }>(child) && child.type === TableHeader) as React.ReactElement<{ children?: React.ReactNode }> | undefined;
    const row = header && React.Children.toArray(header.props.children).find(React.isValidElement) as React.ReactElement<{ children?: React.ReactNode }> | undefined;
    const labels = row ? React.Children.toArray(row.props.children).map(cell => React.isValidElement<{ children?: React.ReactNode; colSpan?: number }>(cell) ? plainText(cell.props.children) : "") : [];
    const content = mobileCards ? groups.map(group => {
      if (!React.isValidElement<{ children?: React.ReactNode; colSpan?: number }>(group) || group.type !== TableBody) return group;
      return React.cloneElement(group, {}, React.Children.map(group.props.children, row => {
        if (!React.isValidElement<{ children?: React.ReactNode; colSpan?: number }>(row)) return row;
        return React.cloneElement(row, {}, React.Children.map(row.props.children, (cell, index) => React.isValidElement<{ children?: React.ReactNode; colSpan?: number }>(cell) ? React.cloneElement(cell, { "data-label": cell.props.colSpan ? "" : labels[index] || "" } as React.HTMLAttributes<HTMLElement>) : cell));
      }));
    }) : children;
    return <div className={cn("relative w-full", mobileCards ? "md:overflow-auto" : "overflow-auto")}><table ref={ref} className={cn("w-full caption-bottom text-sm", mobileCards && "mobile-card-table", className)} {...props}>{content}</table></div>;
  },
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
