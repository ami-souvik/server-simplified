import "ai";

declare module "ai" {
  interface ChatInit {
    api?: string;
    metadata?: Record<string, unknown>;
    body?: Record<string, unknown>;
  }

  interface UIMessage {
    createdAt?: Date;
    type?: string;
    text?: string;
    content?: string;
    command?: string;
    toolInvocations?: Array<{
      toolCallId: string;
      toolName: string;
      args: unknown;
      state: "call" | "result";
      result?: unknown;
    }>;
  }
}
