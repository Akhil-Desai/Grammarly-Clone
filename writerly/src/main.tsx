// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // 导入 App 组件
import "./globals.css";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
    <React.StrictMode>
        <App /> {/* 直接使用 App 组件 */}
    </React.StrictMode>
);