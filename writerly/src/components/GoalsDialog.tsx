import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface GoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalyze: () => void;
}

const tones = ["Confident", "Friendly", "Professional", "Direct"] as const;
const intents = ["Inform", "Request", "Suggest", "Apologize"] as const;
const audiences = ["General", "Manager", "Team", "Customer"] as const;
const formality = ["Casual", "Neutral", "Formal"] as const;

const GoalsDialog = ({ open, onOpenChange, onAnalyze }: GoalsDialogProps) => {
  const [selectedTone, setSelectedTone] = useState<string>("Professional");
  const [selectedIntent, setSelectedIntent] = useState<string>("Request");
  const [selectedAudience, setSelectedAudience] = useState<string>("General");
  const [selectedFormality, setSelectedFormality] = useState<string>("Neutral");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Goals</DialogTitle>
          <DialogDescription>Set your writing goals for better suggestions</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Tone</h4>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <Badge
                  key={t}
                  variant={t === selectedTone ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTone(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Intent</h4>
            <div className="flex flex-wrap gap-2">
              {intents.map((i) => (
                <Badge
                  key={i}
                  variant={i === selectedIntent ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedIntent(i)}
                >
                  {i}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Audience</h4>
            <div className="flex flex-wrap gap-2">
              {audiences.map((a) => (
                <Badge
                  key={a}
                  variant={a === selectedAudience ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedAudience(a)}
                >
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Formality</h4>
            <div className="flex flex-wrap gap-2">
              {formality.map((f) => (
                <Badge
                  key={f}
                  variant={f === selectedFormality ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedFormality(f)}
                >
                  {f}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={onAnalyze}>Analyze</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalsDialog;


