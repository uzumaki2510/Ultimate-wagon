import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Train } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmployeeInfo {
  id: string;
  name: string;
  department: string;
  currentWagon: string;
  status: "Working" | "Idle" | "Break" | "Offline";
  efficiency: number;
}

export function EmployeeStatus() {
  const employees: EmployeeInfo[] = [
    { id: '1', name: 'John Doe', department: 'Repair', currentWagon: '40030410097', status: 'Working', efficiency: 92 },
    { id: '2', name: 'Jane Smith', department: 'Inspection', currentWagon: '40030410084', status: 'Working', efficiency: 88 },
    { id: '3', name: 'Mike Johnson', department: 'Steam', currentWagon: '-', status: 'Idle', efficiency: 75 },
    { id: '4', name: 'Sarah Williams', department: 'Testing', currentWagon: '-', status: 'Break', efficiency: 95 },
  ];

  return (
    <Card className="shadow-sm border-border/50 h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-h3 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Employee Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="py-2 h-auto">Employee</TableHead>
              <TableHead className="py-2 h-auto">Dept</TableHead>
              <TableHead className="py-2 h-auto">Wagon</TableHead>
              <TableHead className="py-2 h-auto">Status</TableHead>
              <TableHead className="py-2 h-auto text-right">Eff.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map(emp => (
              <TableRow key={emp.id} className="h-[var(--density-row-height,64px)]">
                <TableCell className="font-medium whitespace-nowrap">{emp.name}</TableCell>
                <TableCell className="text-muted-foreground">{emp.department}</TableCell>
                <TableCell>
                  {emp.currentWagon !== '-' ? (
                    <div className="flex items-center gap-1 font-mono text-xs font-bold">
                      <Train className="h-3 w-3 text-muted-foreground" /> {emp.currentWagon}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    emp.status === 'Working' ? 'bg-success/10 text-success border-success/20' :
                    emp.status === 'Break' ? 'bg-warning/10 text-warning border-warning/20' :
                    emp.status === 'Idle' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
                  }>
                    {emp.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {emp.efficiency}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
