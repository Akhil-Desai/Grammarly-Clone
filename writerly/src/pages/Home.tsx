import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Upload, Search, Trash2, User, AppWindow, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

const demoPreview = `Hi Sarah,\n\nI wanted to reach out to you about the project deadline...`;

const Home = () => {
  const navigate = useNavigate();
  const { authorizedFetch, logout } = useAuth();
  const [creating, setCreating] = useState(false);
  const [docs, setDocs] = useState<Array<any>>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);

  async function handleCreateDoc() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await authorizedFetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "",
          metadata: { title: "Untitled doc" },
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "Failed to create document");
      }
      // For now, navigate to demo editor
      navigate("/demo");
    } catch (e: any) {
      alert(e?.message || "Failed to create document");
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDocs(true);
      setDocsError(null);
      try {
        const res = await authorizedFetch("/api/documents");
        const text = await res.text();
        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch {}
        if (!res.ok) {
          throw new Error(data?.error || text || "Failed to load documents");
        }
        if (!cancelled) setDocs(Array.isArray(data?.documents) ? data.documents : []);
      } catch (e: any) {
        if (!cancelled) setDocsError(e?.message || "Failed to load documents");
      } finally {
        if (!cancelled) setLoadingDocs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authorizedFetch]);
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
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
          <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-muted">
            <FileText className="w-4 h-4" />
            Docs
          </Link>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/60 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Version history
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/60 text-muted-foreground">
            <Trash2 className="w-4 h-4" />
            Trash
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/60 text-muted-foreground">
            <User className="w-4 h-4" />
            Account
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/60 text-muted-foreground">
            <AppWindow className="w-4 h-4" />
            Apps
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <div className="h-16 flex items-center justify-between px-8 border-b">
          <h1 className="text-2xl font-semibold">Docs</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleCreateDoc} disabled={creating}>
              <Plus className="w-4 h-4 mr-2" /> New doc
            </Button>
            <Button size="sm" variant="outline">
              <Upload className="w-4 h-4 mr-2" /> Upload
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="max-w-xl mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search docs" className="pl-9" />
            </div>
          </div>

          {loadingDocs ? (
            <div className="text-sm text-muted-foreground">Loading documents…</div>
          ) : docsError ? (
            <div className="text-sm text-destructive">Error: {docsError}</div>
          ) : docs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No documents yet. Create your first one.</div>
          ) : (
            <>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Your documents</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                {docs.map((d: any) => (
                  <Link key={d.id} to="/demo" className="block">
                    <Card className="hover:shadow transition-shadow h-full">
                      <CardContent className="p-4">
                        <Badge variant="secondary" className="mb-2">Classic</Badge>
                        <div className="space-y-2">
                          <div className="font-medium">{d.title || "Untitled doc"}</div>
                          <div className="text-xs text-muted-foreground">
                            Edited {new Date(d.updated_at).toLocaleString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;


