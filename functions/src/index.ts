import { onCall } from "firebase-functions/v2/https";
import { VertexAI } from "@google-cloud/vertexai";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

const vertexAI = new VertexAI({
  project: "babytouch-63ad3",
  location: "asia-northeast1"
});

interface TouchOperation {
  x: number;
  y: number;
  timestamp: number;
  type: "tap" | "drag" | "hold";
  duration?: number;
  velocity?: number;
}

interface AnalyzeTouchPayload {
  operations: TouchOperation[];
  nickname?: string;
  birthMonth?: string;
  gender?: string;
}

interface AIResponse {
  emotion: string;
  message: string;
}

export const analyzeTouchHistory = onCall({ region: "asia-northeast1" }, async (request): Promise<AIResponse> => {
  const { operations, nickname, birthMonth, gender } = request.data as AnalyzeTouchPayload;
  logger.info("Received touch history:", operations);

  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error("操作履歴が無効です");
  }

  const userInfo = `
【ユーザー情報】
ニックネーム: ${nickname || "未設定"}
誕生年月: ${birthMonth || "不明"}
性別: ${gender || "不明"}
`;

  const prompt = `
以下は赤ちゃんのタッチ操作履歴です。${userInfo}の内容も参考にしながら、行動から想像される感情を以下の候補から1つ選び、
「emotion: ◯◯」という形式で表現してください。
次に、推定した感情に関して、なぜその感情だと推定したかの理由を含んだ形で、赤ちゃん向けの返事を「message: ◯◯」という形式で日本語で書いてください。

emotion 候補: joyful, excited, calm, surprised, curious, explorative

出力形式の例：
emotion: excited
message: 短い時間でたくさんタッチしているから、とってもわくわくしているのかな？

操作履歴:
${JSON.stringify(operations.slice(-5), null, 2)}
`;

  const generativeModel = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await generativeModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  });

  const rawText = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  logger.info("Gemini response:", rawText);

  const aiResponse = parseGeminiResponse(rawText);

  // 🔥 Firestore に保存
  const today = new Date();
  const ymd = today.toISOString().split('T')[0]; // 例: 2025-06-18

  const parentDocRef = db.collection("emotionLogs").doc(ymd);

  // 親ドキュメントを確保（存在しない場合は作る）
  await parentDocRef.set({ createdAt: today.toISOString() }, { merge: true });

  // サブコレクションに追加
  await parentDocRef.collection("entries").add({
    timestamp: today.toISOString(),
    nickname: nickname || null,
    birthMonth: birthMonth || null,
    gender: gender || null,
    emotion: aiResponse.emotion,
    message: aiResponse.message,
    operations: operations.slice(-5)
  });

  return aiResponse;
});

function parseGeminiResponse(text: string): AIResponse {
  const lines = text.trim().split("\n");
  const emotionLine = lines.find(line => line.toLowerCase().startsWith("emotion:"));
  const messageLine = lines.find(line => line.toLowerCase().startsWith("message:"));

  return {
    emotion: emotionLine?.split(":")[1]?.trim() || "curious",
    message: messageLine?.split(":")[1]?.trim() || "きょうみしんしん？"
  };
}
