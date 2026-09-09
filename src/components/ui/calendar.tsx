import type { ComponentProps } from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import 'react-day-picker/style.css';
import { cn } from '@/lib/utils';
export type CalendarProps = ComponentProps<typeof DayPicker>;
export function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  return <DayPicker showOutsideDays={showOutsideDays} className={cn('p-3 [--rdp-accent-color:hsl(var(--primary))] [--rdp-accent-background-color:hsl(var(--accent))] [--rdp-day_button-height:44px] [--rdp-day_button-width:40px]', className)} components={{ Chevron: ({ orientation, className }) => orientation === 'left' ? <ChevronLeft className={className} /> : orientation === 'right' ? <ChevronRight className={className} /> : <ChevronDown className={className} /> }} {...props} />;
}
