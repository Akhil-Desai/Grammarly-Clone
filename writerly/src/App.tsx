import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Apps from "./pages/Apps";
import Account from "./pages/Account";
import Trash from "./pages/Trash";
import VersionHistory from "./pages/VersionHistory";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import "./index.css";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <AuthProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <Home />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/apps"
                                element={
                                    <ProtectedRoute>
                                        <Apps />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/account"
                                element={
                                    <ProtectedRoute>
                                        <Account />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/trash"
                                element={
                                    <ProtectedRoute>
                                        <Trash />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/version-history"
                                element={
                                    <ProtectedRoute>
                                        <VersionHistory />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/search"
                                element={
                                    <ProtectedRoute>
                                        <SearchResults />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/demo"
                                element={
                                    <ProtectedRoute>
                                        <Index />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/doc/:id"
                                element={
                                    <ProtectedRoute>
                                        <Index />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </AuthProvider>
                </BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;