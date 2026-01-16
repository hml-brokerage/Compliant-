import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private client: OpenAI | null = null;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('AI_MODEL', 'gpt-4');

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.logger.log('OpenAI provider initialized');
    } else {
      this.logger.warn('OpenAI API key not configured');
    }
  }

  async analyze(prompt: string, text: string): Promise<{ response: string; tokensUsed: number; cost: number }> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const startTime = Date.now();

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance document analyzer. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt.replace('{{{text}}}', text),
          },
        ],
        temperature: parseFloat(this.configService.get<string>('AI_TEMPERATURE', '0.2')),
        max_tokens: parseInt(this.configService.get<string>('AI_MAX_TOKENS', '2000'), 10),
      });

      const processingTime = Date.now() - startTime;
      const tokensUsed = completion.usage?.total_tokens || 0;
      
      // Estimate cost (GPT-4: $0.03/1K input + $0.06/1K output)
      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;
      const cost = (inputTokens * 0.03 + outputTokens * 0.06) / 1000;

      this.logger.log(
        `OpenAI analysis completed in ${processingTime}ms, ${tokensUsed} tokens, $${cost.toFixed(4)}`,
      );

      return {
        response: completion.choices[0]?.message?.content || '',
        tokensUsed,
        cost,
      };
    } catch (error) {
      this.logger.error(`OpenAI analysis failed: ${error.message}`);
      throw error;
    }
  }
}
