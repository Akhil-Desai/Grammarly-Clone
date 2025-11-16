import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  title?: string;
  score?: number;
  onOpenGoals?: () => void;
  onTitleChange?: (title: string) => void;
}

const Header = ({ title = "Untitled document", score, onOpenGoals, onTitleChange }: HeaderProps) => {
  const scoreLabel = typeof score === "number" ? `${score} Overall score` : undefined;

  return (
    <header className="bg-transparent">
      <div className="mx-auto max-w-3xl px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Go to home" className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </Link>
          {onTitleChange ? (
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Untitled document"
              className="text-base font-medium text-foreground bg-transparent outline-none border-b border-transparent focus:border-muted-foreground/30"
            />
          ) : (
            <h1 className="text-base font-medium text-foreground">{title}</h1>
          )}
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
