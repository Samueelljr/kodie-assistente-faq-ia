import "dotenv/config";
import express from "express";
import { responderPergunta } from "./services/geminiService.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "online", service: "FAQ Assistant API" });
});

app.post("/api/faq", async (req, res) => {
  const { cliente = "Cliente", pergunta } = req.body;

  if (!pergunta || typeof pergunta !== "string" || !pergunta.trim()) {
    return res.status(400).json({
      erro: "O campo 'pergunta' é obrigatório e deve ser um texto válido.",
    });
  }

  try {
    const resultado = await responderPergunta(cliente, pergunta.trim());
    return res.json({
      cliente,
      pergunta: pergunta.trim(),
      ...resultado,
    });
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return res.status(500).json({
      erro: "Falha ao processar a pergunta com a IA.",
      detalhes: error.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor Express rodando na porta ${PORT}`);
});