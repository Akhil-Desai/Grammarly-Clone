// src/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import VersionHistory from "./pages/VersionHistory";
import Trash from "./pages/Trash";
import Account from "./pages/Account";
import Apps from "./pages/Apps";
import SearchResults from "./pages/SearchResults";
import DocumentEditor from "./pages/DocumentEditor";
import Login from "./pages/Login";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: "version-history", element: <VersionHistory /> },
            { path: "trash", element: <Trash /> },
            { path: "account", element: <Account /> },
            { path: "apps", element: <Apps /> },
            { path: "search", element: <SearchResults /> },
            { path: "doc/:id", element: <DocumentEditor /> },
        ],
    },
]);