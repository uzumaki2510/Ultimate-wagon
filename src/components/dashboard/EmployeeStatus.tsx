import React, { useMemo } from 'react';
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
import { useAppStore } from '@/store/useAppStore';

interface EmployeeInfo {
  id: string;
  name: string;
  department: string;
  currentWagon: string;
  status: string;
  efficiency: string;
}

export function EmployeeStatus() {
  const { employees, workflows } = useAppStore();

  const employeeData = useMemo(() => {
    return employees.map(emp => {
      let currentWagon = '-';
      let status: string = 'Idle';
      
      // Find if employee is assigned to any active workflow stage
      const activeWorkflow = workflows.find(wf => {
        return wf.stages.some(st => 
          st.status === 'In Progress' && st.staffName === emp.name
        );
      });

      if (activeWorkflow) {
        currentWagon = activeWorkflow.wagonNo || '-';
        status = 'Working';
      }

      return {
        id: emp.id,
        name: emp.name,
        department: emp.designation || 'Operations',
        currentWagon,
        status,
        efficiency: '—'
      };
    });
  }, [employees, workflows]);

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
            {employeeData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employeeData.map(emp => (
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
                  <TableCell className="text-right font-semibold text-muted-foreground">
                    {emp.efficiency}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
