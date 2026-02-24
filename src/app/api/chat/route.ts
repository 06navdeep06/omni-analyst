import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const apiKey = process.env.FIREWORKS_API_KEY || 'placeholder_key';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const client = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.fireworks.ai/inference/v1",
});

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { message, reportId, userId } = await req.json();

    if (!message || !reportId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get Report Context
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('summary, key_insights, title')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // 2. Get or Create Chat Session
    let sessionId;
    const { data: sessionData } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .single();

    if (sessionData) {
      sessionId = sessionData.id;
    } else {
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({ report_id: reportId, user_id: userId })
        .select()
        .single();
      
      if (createError) throw createError;
      sessionId = newSession.id;
    }

    // 3. Save User Message
    await supabase.from('messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message
    });

    // 4. Fetch Chat History (Limit to last 10 messages for context window)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }); // Get oldest first for context

    // 5. Construct Prompt with Context
    const systemPrompt = `You are a helpful AI assistant analyzing a report titled "${report.title}".
Here is the report summary:
${report.summary}

Key Insights:
${JSON.stringify(report.key_insights)}

Answer the user's questions based on this information. Be concise and professional.`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...(history?.map(m => ({ role: m.role, content: m.content })) || [])
    ];

    // 6. Call AI
    const completion = await client.chat.completions.create({
      model: "accounts/fireworks/models/kimi-k2p5",
      messages: apiMessages as any,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content || "I couldn't generate a response.";

    // 7. Save AI Response
    await supabase.from('messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: aiResponse
    });

    return NextResponse.json({ role: 'assistant', content: aiResponse });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
