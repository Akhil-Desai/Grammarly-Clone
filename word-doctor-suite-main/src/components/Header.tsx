import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface HeaderProps {
  title?: string;
  score?: number;
  onOpenGoals?: () => void;
}

const Header = ({ title = "Untitled document", score, onOpenGoals }: HeaderProps) => {
  const scoreLabel = typeof score === "number" ? `${score} Overall score` : undefined;

  return (
    <header className="bg-transparent">
      <div className="mx-auto max-w-3xl px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-base font-medium text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onOpenGoals}>
            Goals
          </Button>
          {scoreLabel && (
            <Button size="sm" variant="ghost" className="border rounded-full px-3">
              {scoreLabel}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
