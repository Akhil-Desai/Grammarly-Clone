import React from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Masked = ({ length = 8 }: { length?: number }) => {
  return <span>{"•".repeat(Math.max(6, length))}</span>;
};

const Row: React.FC<{
  label: string;
  value: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ label, value, actionLabel = "Update", onAction }) => {
  return (
    <div className="py-5 border-b">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className="text-lg">{value}</div>
        <Button variant="ghost" size="sm" onClick={onAction} className="text-muted-foreground">
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};

const Account: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const onUpdateEmail = async () => {
    const next = window.prompt("Update your email", user?.email || "");
    if (typeof next === "string" && next.trim()) {
      // Placeholder UX only; backend does not yet support email updates
      toast({ title: "Email update requested", description: "Email updates are not enabled in this demo." });
    }
  };

  const onUpdatePassword = async () => {
    // Placeholder UX only; backend does not yet support password updates
    toast({ title: "Password update", description: "Password changes are not enabled in this demo." });
  };

  const score = 100; // not used on this page UI, but Header expects a score
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar mimic from Home with three options */}
      <aside className="w-60 shrink-0 border-r">
        <div className="h-16 flex items-center px-5 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">writerly</div>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/60 text-muted-foreground">
            <FileText className="w-4 h-4" />
            Docs
          </Link>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/60 text-muted-foreground" onClick={() => navigate("/trash")}>
            <Trash2 className="w-4 h-4" />
            Trash
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm bg-muted">
            <User className="w-4 h-4" />
            Account
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <div className="h-16 flex items-center justify-between px-8 border-b">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-3xl w-full px-6 py-8">
          <div className="bg-card rounded-lg border">
            <div className="px-6">
              <Row label="Email" value={user?.email || "Unknown"} onAction={onUpdateEmail} />
              <Row label="Password" value={<Masked />} onAction={onUpdatePassword} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Account;


