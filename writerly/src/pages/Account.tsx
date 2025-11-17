import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { User, Mail, Lock, Bell, CreditCard, HelpCircle, LogOut } from "lucide-react";

interface UserData {
    id: string;
    email: string;
    name: string;
    created_at: string;
    plan: string;
}

export default function Account() {
    const { user, authorizedFetch, logout } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                const response = await authorizedFetch("/api/auth/me");

                if (!response.ok) {
                    throw new Error("Failed to fetch user profile");
                }

                const data = await response.json();
                setUserData(data);
                setName(data.name || "");
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
                console.error("Error fetching user profile:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchUserProfile();
        }
    }, [authorizedFetch, user]);

    const updateProfile = async () => {
        if (!name.trim() || !userData) return;

        try {
            setUpdating(true);
            const response = await authorizedFetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            const updatedData = await response.json();
            setUserData(updatedData);
            alert("Profile updated successfully");
        } catch (err) {
            console.error("Error updating profile:", err);
            alert(err instanceof Error ? err.message : "Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    const changePassword = async () => {
        if (!currentPassword || !newPassword || !userData) return;

        try {
            setUpdating(true);
            const response = await authorizedFetch("/api/auth/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (!response.ok) {
                throw new Error("Failed to change password");
            }

            setCurrentPassword("");
            setNewPassword("");
            alert("Password changed successfully");
        } catch (err) {
            console.error("Error changing password:", err);
            alert(err instanceof Error ? err.message : "Failed to change password");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="border rounded-md p-6">
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, j) => (
                                            <div key={j} className="space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                                                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {userData ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            <Tabs defaultValue="profile" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="profile">Profile</TabsTrigger>
                                    <TabsTrigger value="password">Password</TabsTrigger>
                                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                                    <TabsTrigger value="billing">Billing</TabsTrigger>
                                </TabsList>

                                <TabsContent value="profile" className="space-y-6">
                                    <div className="border rounded-md p-6">
                                        <CardHeader>
                                            <CardTitle>Personal Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    value={userData.email}
                                                    readOnly
                                                    className="bg-muted"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Account Created</Label>
                                                <div className="text-muted-foreground">
                                                    {new Date(userData.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={updateProfile}
                                                disabled={updating || !name.trim()}
                                            >
                                                {updating ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </CardContent>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="space-y-6">
                            <div className="border rounded-md p-6">
                                <CardHeader>
                                    <CardTitle>Account Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <button className="w-full border rounded-md px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4" />
                                        Get Help
                                    </button>
                                    <button
                                        className="w-full border rounded-md px-4 py-2 text-sm hover:bg-muted text-destructive flex items-center gap-2"
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to log out?")) {
                                                logout();
                                            }
                                        }}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Log Out
                                    </button>
                                </CardContent>
                            </div>

                            <div className="border rounded-md p-6">
                                <CardHeader>
                                    <CardTitle>Current Plan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold mb-2">
                                        {userData.plan || "Free"}
                                    </div>
                                    <Button className="w-full">Upgrade</Button>
                                </CardContent>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Could not load account information</p>
                        <button
                            className="mt-4 border rounded-md px-4 py-2 text-sm hover:bg-muted"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
}