import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Upload, Search, Trash2, User, AppWindow, Clock } from "lucide-react";

const demoPreview = `Hi Sarah,\n\nI wanted to reach out to you about the project deadline...`;

const Home = () => {
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
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> New doc
            </Button>
            <Button size="sm" variant="outline">
              <Upload className="w-4 h-4 mr-2" /> Upload
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

          <h2 className="text-sm font-medium text-muted-foreground mb-3">Earlier</h2>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            <Link to="/demo" className="block">
              <Card className="hover:shadow transition-shadow h-full">
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2">Classic</Badge>
                  <div className="space-y-2">
                    <div className="font-medium">Untitled doc</div>
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">{demoPreview}</p>
                    <div className="text-xs text-muted-foreground">Edited today</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;


