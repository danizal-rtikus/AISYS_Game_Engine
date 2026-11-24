import { ModelOption, DiagnosticInfo } from '../types';

export interface StreamOptions {
  apiKey: string;
  baseUrl: string;
  model: ModelOption;
  systemPrompt: string;
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  onChunk: (delta: string, fullText: string, isThinking?: boolean) => void;
  onError: (err: Error) => void;
  onFinish: (fullText: string, diagnostic: DiagnosticInfo) => void;
  signal?: AbortSignal;
}

export async function sendDeepSeekMessage(options: StreamOptions): Promise<void> {
  const { apiKey, baseUrl, model, systemPrompt, history, onChunk, onError, onFinish, signal } = options;

  if (!apiKey || apiKey.trim() === '') {
    onError(new Error('API Key belum diisi. Silakan masukkan API Key di menu Settings (kanan atas).'));
    return;
  }

  // Normalize endpoint URL
  let rawUrl = baseUrl.trim();
  if (rawUrl.includes('api.sumopod.com')) {
    rawUrl = rawUrl.replace('api.sumopod.com', 'ai.sumopod.com');
  }
  if (rawUrl.endsWith('/')) {
    rawUrl = rawUrl.slice(0, -1);
  }
  if (!rawUrl.endsWith('/chat/completions')) {
    rawUrl = `${rawUrl}/chat/completions`;
  }

  // In production (HTTPS / Vercel), call ai.sumopod.com directly because it allows CORS natively (Access-Control-Allow-Origin: *)
  // Direct HTTPS connection avoids Vercel Edge 15-30s proxy timeouts on long code generation streams!
  // In local dev, use /api-proxy with fallback to direct rawUrl.
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const proxyUrl = rawUrl.replace(/^https?:\/\/[^/]+/, '/api-proxy');
  const targetUrl = isHttps ? rawUrl : proxyUrl;

  // Clean Zero-Leak Engine Log (never expose vendor endpoint or model names in client console)
  console.info('[AISYS Engine] Menginisialisasi Studio Core & Generator Game...');

  // Build messages array with persistent system prompt at index 0 and strictly purge any empty content
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
      .filter((m) => m.content && m.content.trim() !== '')
      .map((m) => ({
        role: m.role,
        content: m.content.trim(),
      })),
  ];

  const payload = {
    model: model,
    messages: messages,
    stream: true,
    stream_options: { include_usage: true },
    temperature: 0.7,
    max_tokens: 16384,
  };

  const startTime = performance.now();
  let usageInfo: { completion_tokens?: number; prompt_tokens?: number; total_tokens?: number } | null = null;

  try {
    let response: Response;

    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (primaryFetchErr: any) {
      if (primaryFetchErr.name === 'AbortError') throw primaryFetchErr;

      // Fallback: if direct failed, try proxy; if proxy failed, try direct
      const fallbackUrl = targetUrl === rawUrl ? proxyUrl : rawUrl;
      console.warn('[AISYS Engine] Mengalihkan rute koneksi studio...');

      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify(payload),
        signal,
      });
    }

    // Check HTTP status code
    if (!response.ok) {
      const rawText = await response.text();
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(rawText);
        if (errorJson.error?.message) {
          errorMsg = errorJson.error.message;
        } else if (errorJson.message) {
          errorMsg = errorJson.message;
        }
      } catch {
        if (rawText) {
          errorMsg += ` - ${rawText}`;
        }
      }
      throw new Error(errorMsg);
    }

    const contentType = response.headers.get('content-type') || '';

    // Handle non-streaming JSON response fallback
    if (contentType.includes('application/json')) {
      const json = await response.json();
      if (json.error) {
        throw new Error(json.error.message || JSON.stringify(json.error));
      }
      const choice = json.choices?.[0];
      const text =
        choice?.message?.content ||
        choice?.message?.reasoning_content ||
        choice?.text ||
        '';
      if (!text.trim()) {
        throw new Error('Mesin AI merespon dengan data kosong. Periksa kuota token atau ganti model.');
      }
      const durationMs = Math.round(performance.now() - startTime);
      const diagnostic: DiagnosticInfo = {
        finishReason: choice?.finish_reason || 'stop',
        completionTokens: json.usage?.completion_tokens,
        promptTokens: json.usage?.prompt_tokens,
        totalTokens: json.usage?.total_tokens,
        durationMs,
        lineCount: text.split('\n').length,
        charCount: text.length,
      };
      onChunk(text, text, false);
      onFinish(text, diagnostic);
      return;
    }

    if (!response.body) {
      throw new Error('ReadableStream tidak didukung oleh browser ini.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let accumulatedReasoning = '';
    let buffer = '';
    let lastFinishReason: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check if raw JSON error was streamed
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const maybeErr = JSON.parse(trimmed);
            if (maybeErr.error) {
              throw new Error(maybeErr.error.message || JSON.stringify(maybeErr.error));
            }
          } catch (e: any) {
            if (e.message && !e.message.includes('JSON')) throw e;
          }
        }

        if (!trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.replace(/^data:\s*/, '').trim();
        if (dataStr === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(dataStr);

          // Detect error inside SSE payload
          if (parsed.error) {
            throw new Error(parsed.error.message || JSON.stringify(parsed.error));
          }

          // Capture usage metrics if gateway provides stream_options usage
          if (parsed.usage) {
            usageInfo = parsed.usage;
          }

          const choice = parsed.choices?.[0];
          if (choice?.finish_reason) {
            lastFinishReason = choice.finish_reason;
          }
          // Support all possible delta and message formats
          const delta =
            choice?.delta?.content ??
            choice?.delta?.text ??
            choice?.message?.content ??
            choice?.text ??
            '';
          const reasoning =
            choice?.delta?.reasoning_content ??
            choice?.message?.reasoning_content ??
            '';

          // Accumulate reasoning
          if (reasoning) {
            accumulatedReasoning += reasoning;
            if (!fullText) {
              onChunk('', '', true); // Thinking indicator
            }
          }

          // Accumulate actual content
          if (delta) {
            fullText += delta;
            onChunk(delta, fullText, false);
          }
        } catch (e: any) {
          if (e.message && !e.message.includes('JSON')) {
            throw e;
          }
        }
      }
    }

    // Flush any leftover in buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data:')) {
        const dataStr = trimmed.replace(/^data:\s*/, '').trim();
        if (dataStr && dataStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) throw new Error(parsed.error.message);
            // Capture usage metrics if gateway provides stream_options usage
          if (parsed.usage) {
            usageInfo = parsed.usage;
          }

          const choice = parsed.choices?.[0];
          if (choice?.finish_reason) {
            lastFinishReason = choice.finish_reason;
          }
            const delta =
              choice?.delta?.content ??
              choice?.delta?.text ??
              choice?.message?.content ??
              choice?.text ??
              '';
            const reasoning =
              choice?.delta?.reasoning_content ??
              choice?.message?.reasoning_content ??
              '';
            if (reasoning) accumulatedReasoning += reasoning;
            if (delta) {
              fullText += delta;
              onChunk(delta, fullText, false);
            }
          } catch (e: any) {
            if (e.message && !e.message.includes('JSON')) throw e;
          }
        }
      }
    }

    // Fallback 1: If fullText is empty, but accumulatedReasoning has the code/response, use it!
    if (!fullText.trim() && accumulatedReasoning.trim()) {
      fullText = accumulatedReasoning.trim();
      onChunk(fullText, fullText, false);
    }

    // Fallback 2: If model returned completely empty response, auto-retry with standard flash
    if (!fullText.trim() && model === 'deepseek-v4-flash') {
      return sendDeepSeekMessage({
        ...options,
        model: 'deepseek-flash',
      });
    }

    // If still empty after all fallbacks, report helpful error
    if (!fullText.trim()) {
      throw new Error(
        'Generator engine tidak menerima respons. Silakan coba kirim ulang permintaan Anda.'
      );
    }

    const durationMs = Math.round(performance.now() - startTime);
    const diagnostic: DiagnosticInfo = {
      finishReason: lastFinishReason,
      completionTokens: usageInfo?.completion_tokens,
      promptTokens: usageInfo?.prompt_tokens,
      totalTokens: usageInfo?.total_tokens,
      durationMs,
      lineCount: fullText.split('\n').length,
      charCount: fullText.length,
    };
    console.info('[AISYS Diagnostic Metrics]:', diagnostic);
    onFinish(fullText, diagnostic);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return;
    }
    // Zero-leak error sanitizer: clean out raw URLs or internal provider keys from error text
    const cleanMsg = (err?.message || String(err))
      .replace(/https?:\/\/[^\s]+/g, '[Studio Gateway]')
      .replace(/sumopod/gi, 'AISYS')
      .replace(/deepseek-[a-z0-9-]+/gi, 'Engine');
    console.error('[AISYS Engine Error]:', cleanMsg);
    onError(new Error(cleanMsg));
  }
}
