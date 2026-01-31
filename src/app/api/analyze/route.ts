import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { imageBase64, prompt } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Image data missing" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server AI configuration missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Gunakan model Flash karena cepat & murah (gratis di tier tertentu)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Hapus prefix data url (data:image/jpeg;base64,...) jika ada
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    const result = await model.generateContent([
      prompt || "Analyze this document.",
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);
    
    const responseText = result.response.text();
    return NextResponse.json({ result: responseText });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed to analyze document" }, { status: 500 });
  }
}