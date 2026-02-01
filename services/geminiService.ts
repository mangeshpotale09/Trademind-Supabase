
import { GoogleGenAI, Type } from "@google/genai";
import { Trade, AIReview, GroundingSource } from "../types";

// AI Coach Audit: Evaluates individual trades with Google Search grounding for market context.
export const getAIReviewForTrade = async (trade: Trade): Promise<AIReview | null> => {
  if (!process.env.API_KEY) return null;
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a professional trading coach. Analyze the trade below and return a structured review in strict JSON format.
      
      Trade Data:
      ${JSON.stringify(trade, null, 2)}
      `,
      config: {
        systemInstruction: "You are a world-class trading psychologist and risk manager. Evaluate the trade based on logic, discipline, and risk/reward. Return only the JSON review following the provided schema. Use Google Search to cross-reference market context for the trade date and symbol if helpful.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Trade quality score (1-10)" },
            well: { type: Type.STRING, description: "What was done well" },
            wrong: { type: Type.STRING, description: "What went wrong" },
            violations: { type: Type.BOOLEAN, description: "Whether the user violated trading rules" },
            improvement: { type: Type.STRING, description: "One actionable improvement" }
          },
          required: ["score", "well", "wrong", "violations", "improvement"]
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || '';
    const review = JSON.parse(text.trim()) as AIReview;
    
    // Extract grounding sources from search results to display in UI
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: GroundingSource[] = [];
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }
    
    return {
      ...review,
      sources: sources.length > 0 ? sources : undefined,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("AI Review error:", error);
    return null;
  }
};

// Weekly Performance Audit: Analyzes batches of trades for behavioral patterns.
export const getWeeklyInsights = async (trades: Trade[]): Promise<string | null> => {
  if (!process.env.API_KEY || trades.length === 0) return null;
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze these recent trades from the past week and provide a deep summary including pattern detection and behavioral insights.
      
      Trades:
      ${JSON.stringify(trades.slice(-20), null, 2)}
      `,
      config: {
        systemInstruction: "You are an expert performance coach for hedge fund traders. Analyze the batch of trades for patterns in behavior, timing, and risk management. Provide a high-level summary, identify the biggest psychological leak, and suggest a focus for next week.",
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    return response.text || null;
  } catch (error) {
    console.error("Weekly Insights error:", error);
    return null;
  }
};

// Natural Language History Query: Answers specific performance questions using search grounding.
export const queryTradeHistory = async (query: string, trades: Trade[]): Promise<string | null> => {
  if (!process.env.API_KEY) return null;
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User Query: ${query}
      
      Based on the following trade data:
      ${JSON.stringify(trades.slice(-50), null, 2)}
      `,
      config: {
        systemInstruction: "Answer the user's question about their trading performance using only the provided data. Be concise and data-driven.",
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || '';
    
    // Extract grounding chunks and append to the text response as required by the guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      const links = groundingChunks
        .map((chunk: any) => chunk.web ? `\n- [${chunk.web.title}](${chunk.web.uri})` : '')
        .filter(Boolean)
        .join('');
      if (links) {
        text += `\n\n**Sources:**${links}`;
      }
    }

    return text || null;
  } catch (error) {
    console.error("Query error:", error);
    return null;
  }
};
