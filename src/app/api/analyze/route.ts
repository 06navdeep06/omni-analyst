import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with Fireworks configuration
const client = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: "https://api.fireworks.ai/inference/v1",
});

export async function POST(req: NextRequest) {
  try {
    const { content, type } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Construct the messages based on the input type
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are an expert analyst. Your goal is to provide a comprehensive intelligence report based on the provided content. Return the response in JSON format with "summary" (string), "key_insights" (array of strings), and "sentiment" (string) fields.',
      }
    ];

    if (type === 'image_url') {
       messages.push({
        role: 'user',
        content: [
          { type: "text", text: "Analyze this image and provide a summary and key insights." },
          { type: "image_url", image_url: { url: content } }
        ]
       });
    } else {
       // Default text/url handling
       const prompt = type === 'url' 
        ? `Analyze the content of the following URL: ${content}. Provide a summary and key insights.`
        : `Analyze the following text/data: ${content}. Provide a summary and key insights.`;
       
       messages.push({ role: 'user', content: prompt });
    }

    const completion = await client.chat.completions.create({
      model: "accounts/fireworks/models/kimi-k2p5",
      messages: messages,
      max_tokens: 32768,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0].message.content;
    
    if (!result) {
        throw new Error("No result from AI");
    }

    const parsedResult = JSON.parse(result);

    return NextResponse.json(parsedResult);
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze content';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
