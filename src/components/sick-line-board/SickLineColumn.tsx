import { Wagon } from "@/types";
import { WagonBoardCard } from "./WagonBoardCard";
import { BoardColumn } from "./statusMapping";
import { useState } from "react";

interface SickLineColumnProps {
  id: BoardColumn;
  title: string;
  wagons: Wagon[];
  isDragActive: boolean;
  isValidTarget: boolean;
  onDropColumn: (targetColumn: BoardColumn) => void;
  onDragStartCard: (wagonId: string) => void;
  onDragEndCard: () => void;
  onMoveRequest: (wagon: Wagon, targetColumn: BoardColumn) => void;
  isAdmin: boolean;
}

export function SickLineColumn({ 
  id, title, wagons, 
  isDragActive, isValidTarget, 
  onDropColumn, onDragStartCard, onDragEndCard, onMoveRequest,
  isAdmin 
}: SickLineColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div 
      data-testid={`board-column-${id}`}
      className={`flex flex-col min-w-[300px] max-w-[300px] rounded-lg p-3 shrink-0 border transition-colors ${
        isDragActive 
          ? isValidTarget 
            ? isDragOver ? "bg-primary/20 border-primary" : "bg-primary/5 border-primary/50 border-dashed"
            : "bg-muted/10 opacity-50 grayscale"
          : "bg-muted/30"
      }`}
      onDragOver={(e) => {
        if (!isDragActive || !isValidTarget) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (isDragActive && isValidTarget) {
          onDropColumn(id);
        }
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider">{title}</h3>
        <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium">{wagons.length}</span>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-2 h-full">
        {wagons.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8 border-2 border-dashed border-muted/50 rounded-lg flex items-center justify-center h-24">
            No wagons
          </div>
        ) : (
          wagons.map(wagon => (
            <WagonBoardCard 
              key={wagon.id} 
              wagon={wagon} 
              draggable={isAdmin}
              onDragStart={onDragStartCard}
              onDragEnd={onDragEndCard}
              onMoveRequest={onMoveRequest}
            />
          ))
        )}
      </div>
    </div>
  );
}
