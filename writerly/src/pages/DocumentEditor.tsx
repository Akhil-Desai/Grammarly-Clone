// src/pages/DocumentEditor.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, Save, History, Trash2, X } from "lucide-react";

export default function DocumentEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState("Untitled document");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // 模拟加载文档
        if (id) {
            setTimeout(() => {
                setTitle("Sample Document");
                setContent("This is a sample document. Start writing here...");
                setLoading(false);
            }, 800);
        } else {
            setLoading(false);
        }
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const method = id ? "PUT" : "POST";
            const url = id ? `/api/documents/${id}` : "/api/documents";

            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content }),
            });

            alert("Document saved successfully!");
        } catch (error) {
            console.error("Error saving document:", error);
            alert("Failed to save document");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to move this document to trash?")) {
            fetch(`/api/documents/${id}/trash`, { method: "POST" })
                .then(() => navigate("/trash"))
                .catch((error) => {
                    console.error("Error deleting document:", error);
                    alert("Failed to move document to trash");
                });
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xl font-medium border-none focus-visible:ring-1 focus-visible:ring-blue-500 px-0"
                        placeholder="Untitled document"
                    />
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? "Saving..." : "Save"}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Save document</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => navigate("/version-history")}>
                                        <History className="w-4 h-4 mr-2" />
                                        Versions
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View version history</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="destructive" onClick={handleDelete}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Trash
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Move to trash</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* 工具栏 */}
                <div className="flex items-center gap-2 mb-4 p-2 border rounded-md">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Bold className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Italic className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Underline className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <List className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <ListOrdered className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <AlignLeft className="w-4 h-4" />
                    </Button>
                </div>

                {/* 编辑器区域 */}
                <div className="flex-1 border rounded-md p-4 min-h-[600px] bg-white">
          <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full resize-none border-none outline-none font-sans text-lg"
              placeholder="Start writing here..."
          />
                </div>
            </div>
        </Layout>
    );
}