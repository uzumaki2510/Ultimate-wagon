import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

interface CommentSectionProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_WORDS = 200;

function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function CommentSection({ value, onChange }: CommentSectionProps) {
  const wordCount = countWords(value);
  const isOverLimit = wordCount > MAX_WORDS;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newWordCount = countWords(newValue);
    
    if (newWordCount <= MAX_WORDS || newValue.length < value.length) {
      onChange(newValue);
    }
  };

  return (
    <Card className="glass animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MessageSquare className="h-5 w-5 text-info" />
          Repair Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          placeholder="Add any additional comments about the repair work, observations, or special instructions (max 200 words)..."
          value={value}
          onChange={handleChange}
          className="min-h-[120px] resize-none"
        />
        <div className="flex justify-between items-center text-sm">
          <p className="text-muted-foreground">
            Add notes about the repair, parts needed, or special instructions.
          </p>
          <p className={`font-medium ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
            {wordCount}/{MAX_WORDS} words
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
