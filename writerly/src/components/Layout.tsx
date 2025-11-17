// src/components/Layout.tsx
import { useState } from "react";
import { FileText, Clock, Trash2, User, AppWindow, Search, Plus, Upload, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import React from "react";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
    showSidebar?: boolean;
    children?: React.ReactNode;
}

export const Layout = ({ showSidebar = true, children }: LayoutProps) => {
    const { logout, user, authorizedFetch } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [creating, setCreating] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const handleCreateDoc = async () => {
        if (creating) return;
        setCreating(true);
        try {
            const response = await authorizedFetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: "",
                    metadata: { title: "Untitled document" },
                }),
            });

            if (!response.ok) throw new Error("Failed to create document");

            const data = await response.json();
            navigate(`/doc/${data.document.id}`);
        } catch (error) {
            console.error("Error creating document:", error);
            alert("Failed to create new document");
        } finally {
            setCreating(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="min-h-screen flex bg-white text-gray-900">
            {showSidebar && (
                <button
                    className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-white shadow-lg border"
                    onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                >
                    {mobileSidebarOpen ? <X/> : <Menu/>}
                </button>
            )}

            {showSidebar && (
                <aside
                    className={`fixed md:static inset-y-0 left-0 w-60 bg-white border-gray-200 border-r z-40 transition-transform duration-300 ease-in-out ${
                        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    }`}
                >
                    <div className="h-16 flex items-center justify-between px-5 border-b">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white"/>
                            </div>
                            <div className="leading-tight">
                                <div className="text-sm font-semibold">Writerly</div>
                            </div>
                        </div>
                        <button
                            className="md:hidden p-1 rounded-full hover:bg-gray-100"
                            onClick={() => setMobileSidebarOpen(false)}
                        >
                            <X className="w-4 h-4"/>
                        </button>
                    </div>

                    <nav className="p-3 space-y-1">
                        <Link
                            to="/"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                            onClick={() => setMobileSidebarOpen(false)}
                        >
                            <FileText className="w-4 h-4"/>
                            Docs
                        </Link>
                        <Link
                            to="/version-history"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 text-gray-600"
                            onClick={() => setMobileSidebarOpen(false)}
                        >
                            <Clock className="w-4 h-4"/>
                            Version history
                        </Link>
                        <Link
                            to="/trash"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 text-gray-600"
                            onClick={() => setMobileSidebarOpen(false)}
                        >
                            <Trash2 className="w-4 h-4"/>
                            Trash
                        </Link>
                        <Link
                            to="/account"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 text-gray-600"
                            onClick={() => setMobileSidebarOpen(false)}
                        >
                            <User className="w-4 h-4"/>
                            Account
                        </Link>
                        <Link
                            to="/apps"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 text-gray-600"
                            onClick={() => setMobileSidebarOpen(false)}
                        >
                            <AppWindow className="w-4 h-4"/>
                            Apps
                        </Link>
                    </nav>

                    <div className="absolute bottom-0 w-full p-3 border-t md:hidden">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600"/>
                            </div>
                            <div className="text-sm flex-1 min-w-0">
                                <div className="font-medium truncate">{user?.email || "User"}</div>
                            </div>
                            <button
                                className="p-1 rounded-full hover:bg-gray-100"
                                onClick={() => {
                                    logout();
                                    navigate("/login");
                                }}
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                </aside>
            )}

            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            <main className="flex-1 flex flex-col">
                <header className="h-16 flex items-center justify-between px-4 md:px-8 border-gray-200 border-b bg-white">
                    <div className="flex items-center gap-4 flex-1">
                        {!showSidebar && (
                            <Link to="/" className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600"/>
                                <span className="font-medium hidden sm:inline">Writerly</span>
                            </Link>
                        )}
                        <form onSubmit={handleSearch} className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                            <Input
                                placeholder="Search docs..."
                                className="pl-9 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={handleCreateDoc}
                            disabled={creating}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 md:mr-2"/>
                            <span className="hidden md:inline">New doc</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                logout();
                                navigate("/login");
                            }}
                            className="hidden md:flex"
                        >
                            <LogOut className="w-4 h-4 mr-2"/>
                            Logout
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};