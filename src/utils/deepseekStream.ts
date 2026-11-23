import { ModelOption } from '../types';

export interface StreamOptions {
  apiKey: string;
  baseUrl: string;
  model: ModelOption;
  systemPrompt: string;
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  onChunk: (delta: string, fullText: string, isThinking?: boolean) => void;
  onError: (err: Error) => void;
  onFinish: (fullText: string) => void;
  signal?: AbortSignal;
}

export async function sendDeepSeekMessage({
  apiKey,
  baseUrl,
  model,
  systemPrompt,
  history,
  onChunk,
  onError,
  onFinish,
  signal,
}: StreamOptions): Promise<void> {
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

  console.info(`[AISYS Stream] Menghubungi model '${model}' via ${targetUrl}...`);

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
    temperature: 0.7,
    max_tokens: 8192,
  };

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
      console.warn(`[AISYS Stream] Target utama gagal, mencoba fallback: ${fallbackUrl}`, primaryFetchErr);

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
      const text = choice?.message?.content || choice?.text || '';
      if (!text.trim()) {
        throw new Error('Mesin AI merespon dengan data kosong. Periksa kuota token atau ganti model.');
      }
      onChunk(text, text, false);
      onFinish(text);
      return;
    }

    if (!response.body) {
      throw new Error('ReadableStream tidak didukung oleh browser ini.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

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

          const choice = parsed.choices?.[0];
          const delta = choice?.delta?.content ?? choice?.delta?.text ?? choice?.text ?? '';
          const reasoning = choice?.delta?.reasoning_content ?? '';

          // 1. If delta (actual content) is arriving: accumulate it and clear thinking indicator
          if (delta) {
            fullText += delta;
            onChunk(delta, fullText, false);
          } else if (reasoning && !fullText) {
            // 2. If reasoning/thinking tokens are arriving before content: notify UI without polluting fullText
            onChunk('', '', true);
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
            const choice = parsed.choices?.[0];
            const delta = choice?.delta?.content ?? choice?.delta?.text ?? choice?.text ?? '';
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

    // If stream ended with 0 content tokens, fail explicitly so user gets clear actionable feedback
    if (!fullText.trim()) {
      throw new Error(
        'Mesin AI tidak mengembalikan kode/teks respon. Silakan coba kirim ulang atau beralih ke model deepseek-flash di menu Settings.'
      );
    }

    onFinish(fullText);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('[AISYS Stream] Permintaan dibatalkan pengguna.');
      return;
    }
    console.error('[AISYS Stream Error]:', err);
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
