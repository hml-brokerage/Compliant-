import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ClaudeProvider {
  private readonly logger = new Logger(ClaudeProvider.name);
  private client: Anthropic | null = null;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.model = 'claude-3-opus-20240229'; // Latest Claude model

    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log('Claude provider initialized');
    } else {
      this.logger.warn('Anthropic API key not configured');
    }
  }

  async analyze(prompt: string, text: string): Promise<{ response: string; tokensUsed: number; cost: number }> {
    if (!this.client) {
      throw new Error('Claude client not initialized');
    }

    const startTime = Date.now();

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: parseInt(this.configService.get<string>('AI_MAX_TOKENS', '2000'), 10),
        messages: [
          {
            role: 'user',
            content: prompt.replace('{{{text}}}', text),
          },
        ],
      });

      const processingTime = Date.now() - startTime;
      const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;
      
      // Estimate cost (Claude Opus: $15/1M input + $75/1M output)
      const inputTokens = message.usage.input_tokens;
      const outputTokens = message.usage.output_tokens;
      const cost = (inputTokens * 15 + outputTokens * 75) / 1000000;

      this.logger.log(
        `Claude analysis completed in ${processingTime}ms, ${tokensUsed} tokens, $${cost.toFixed(4)}`,
      );

      const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';

      return {
        response: responseText,
        tokensUsed,
        cost,
      };
    } catch (error) {
      this.logger.error(`Claude analysis failed: ${error.message}`);
      throw error;
    }
  }
}
