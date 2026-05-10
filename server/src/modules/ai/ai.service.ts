import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiRepository } from './ai.repository';
import { GenerateHabitDto, WeeklyInsightDto } from './ai.dto';

@Injectable()
export class AiService {
  private groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private groqApiKey: string;
  private groqModel: string;

  constructor(private readonly config: ConfigService, private readonly repo: AiRepository) {
    this.groqApiKey = this.config.getOrThrow<string>('GROQ_API_KEY');
    this.groqModel = this.config.get<string>('GROQ_MODEL') ?? 'llama3-8b-8192';
  }

  async generateHabit(userId: string, dto: GenerateHabitDto) {
    const prompt = `Generate a single micro habit based on the user's goal.

Rules:
- Must take less than 10 minutes
- Must be extremely easy to start
- Must reduce friction
- Must clearly relate to the goal

Adaptation:
- If history shows many incomplete habits → make it easier
- If mostly completed → slightly increase difficulty

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "habit": "string",
  "reason": "string"
}

Goal: ${dto.goal}
History: ${JSON.stringify((dto.history ?? []).slice(-10))}`;

    const result = await this.callGroq(prompt, 256, ['habit', 'reason'], 500);
    
    try {
      await this.repo.logRequest({
        userId,
        endpoint: 'generate-habit',
        prompt,
        response: result,
      });
    } catch (error) {
      console.error('Failed to log AI request:', error);
    }

    return result;
  }

  async weeklyInsight(userId: string, dto: WeeklyInsightDto) {
    const completedCount = dto.habits.filter((h) => h.completed).length;
    const total = dto.habits.length;

    const prompt = `You are a habit coach. Analyze this user's habit data from the past week and provide a brief insight.

Habits (${total} total, ${completedCount} completed):
${dto.habits.map((h) => `- "${h.habit}" — ${h.completed ? 'completed' : 'skipped'}`).join('\n')}

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "summary": "a short paragraph summarizing their week — what went well, what didn't, and overall progress",
  "insight": "one specific, actionable suggestion they can apply starting tomorrow"
}`;

    const result = await this.callGroq(prompt, 512, ['summary', 'insight'], 1000);

    try {
      await this.repo.logRequest({
        userId,
        endpoint: 'weekly-insight',
        prompt,
        response: result,
      });
    } catch (error) {
      console.error('Failed to log AI request:', error);
    }

    return result;
  }

  private extractJsonObject(text: string) {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed;
    }

    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first >= 0 && last > first) {
      return text.slice(first, last + 1);
    }

    return '{}';
  }

  private ensureStringKeys(
    payload: unknown,
    requiredKeys: string[],
    maxLength: number = 1000,
  ): Record<string, string> {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('AI returned invalid payload shape');
    }

    const record = payload as Record<string, unknown>;
    const normalized: Record<string, string> = {};

    for (const key of requiredKeys) {
      const value = record[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new BadRequestException(`AI response missing required field: ${key}`);
      }
      if (value.length > maxLength) {
        throw new BadRequestException(`AI response field ${key} exceeds max length of ${maxLength}`);
      }
      normalized[key] = value.trim();
    }

    return normalized;
  }

  private async callGroq(
    prompt: string,
    maxTokens: number,
    requiredKeys: string[],
    maxFieldLength: number = 500,
  ): Promise<Record<string, string>> {
    try {
      const res = await fetch(this.groqApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.groqApiKey}`,
        },
        body: JSON.stringify({
          model: this.groqModel,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new BadRequestException(
          `Groq API failed: ${res.status} - ${errorText}`,
        );
      }

      const data = (await res.json()) as any;
      const text: string = data.choices?.[0]?.message?.content ?? '{}';
      const jsonStr = this.extractJsonObject(text);
      const parsed = JSON.parse(jsonStr) as unknown;
      return this.ensureStringKeys(parsed, requiredKeys, maxFieldLength);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `AI provider error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
