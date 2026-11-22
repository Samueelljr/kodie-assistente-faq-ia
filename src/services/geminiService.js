import { GoogleGenAI, Type } from "@google/genai";
import { FAQ_BASE } from "../data/faqBase.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
Você é o assistente virtual oficial de atendimento da empresa NovaTech Soluções Digitais.
Sua tarefa é responder às dúvidas dos clientes utilizando EXCLUSIVAMENTE as informações fornecidas na BASE DE CONHECIMENTO abaixo.

REGRAS ESTRITAS:
1. Nunca invente prazos, valores, políticas ou informações que não estejam explicitamente na base.
2. Se a pergunta puder ser respondida com a base, responda de forma clara, objetiva e cordial, marcando "encontrou_resposta": true e "precisa_humano": false.
3. Se a pergunta tratar de algo fora da base (ex: negociação especial, erro específico em um pedido, assunto não listado), informe educadamente que um especialista humano dará continuidade, marcando "encontrou_resposta": false e "precisa_humano": true.

BASE DE CONHECIMENTO:
${FAQ_BASE}
`;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function responderPergunta(cliente, pergunta, tentativas = 3) {
  const prompt = `Cliente: ${cliente}\nPergunta: ${pergunta}`;

  for (let i = 1; i <= tentativas; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              encontrou_resposta: {
                type: Type.BOOLEAN,
                description: "True se a resposta estava na base de conhecimento, false caso contrário.",
              },
              tema: {
                type: Type.STRING,
                description: "Categoria da pergunta (ex: Pagamento, Entrega, Troca e Devolução, Horário, Fora do Escopo).",
              },
              resposta: {
                type: Type.STRING,
                description: "Resposta final formatada para ser enviada ao cliente.",
              },
              precisa_humano: {
                type: Type.BOOLEAN,
                description: "True se a dúvida exige encaminhamento para um atendente humano.",
              },
            },
            required: ["encontrou_resposta", "tema", "resposta", "precisa_humano"],
          },
        },
      });

      return JSON.parse(response.text);
    } catch (error) {
      const erroTemporario = error.status === 503 || error.status === 429;
      if (erroTemporario && i < tentativas) {
        await esperar(2000 * i);
        continue;
      }
      throw error;
    }
  }
}