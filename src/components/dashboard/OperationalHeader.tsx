import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Calendar, Briefcase, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function OperationalHeader() {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours();
  let shift = "Night Shift";
  if (hours >= 6 && hours < 14) shift = "Morning Shift";
  else if (hours >= 14 && hours < 22) shift = "Evening Shift";

  const formattedDate = time.toLocaleDateString("en-IN", { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const formattedTime = time.toLocaleTimeString("en-IN", {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });

  return (
    <Card className="border-border/50 shadow-sm bg-card/80 backdrop-blur mb-[var(--density-spacing-md,1rem)]">
      <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left Side: User & Workshop */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Welcome, {user?.name}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Briefcase className="h-3 w-3" />
              <span>Main Railway Workshop</span>
              <Badge variant="outline" className="text-[10px] h-4 py-0 ml-1">{user?.role || "Staff"}</Badge>
            </div>
          </div>
        </div>

        {/* Center: Shift & Time */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/50 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground leading-tight">Date</span>
              <span className="text-sm font-semibold">{formattedDate}</span>
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-8 bg-border"></div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground leading-tight">{shift}</span>
              <span className="text-sm font-bold font-mono tracking-wider text-primary">{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Alerts Placeholder */}
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="flex items-center gap-1 py-1">
            <AlertTriangle className="h-3 w-3" />
            <span>2 Critical Alerts</span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
