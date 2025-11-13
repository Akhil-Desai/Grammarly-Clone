import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/rewrite", async (req, res) => {
    try {
        const { text } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text }] }]
        });

        res.json({ output: result.response.text() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gemini API error" });
    }
});

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
