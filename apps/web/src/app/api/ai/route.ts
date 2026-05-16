import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4-turbo-preview";

  if (!apiKey) {
    return NextResponse.json({
      content: `Demo response: ${prompt.slice(0, 160)}. Connect OPENROUTER_API_KEY in Vercel to enable live AI.`,
      raw: { demo: true },
      model,
    });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_REFERER ? { "HTTP-Referer": process.env.OPENROUTER_REFERER } : {}),
      ...(process.env.OPENROUTER_TITLE ? { "X-OpenRouter-Title": process.env.OPENROUTER_TITLE } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({
      content: `AI service temporarily unavailable. ${errorText}`,
      raw: { error: errorText },
      model,
    });
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "No response from AI service.";

  return NextResponse.json({ content, raw: data, model: data?.model ?? model });
}
