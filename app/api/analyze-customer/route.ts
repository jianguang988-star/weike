import { NextResponse } from "next/server";
import { analyzeCustomer } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const result = await analyzeCustomer(text);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyze customer failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
