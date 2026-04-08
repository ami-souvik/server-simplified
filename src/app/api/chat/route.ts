import { openai } from "@ai-sdk/openai";
import { streamText, stepCountIs } from "ai";
import { saveMessage, updateSessionTitle, getSessions } from "@/lib/db/actions";
import { SSHService } from "@/lib/ssh-service";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, id: sessionId = "default" } = await req.json();

  const lastMessage = messages[messages.length - 1];

  // If this is the first message in a "New Chat" session, update the title
  if (messages.length === 1 && sessionId !== "default") {
    const sessions = await getSessions();
    const currentSession = sessions.find((s) => s.id === sessionId);
    if (currentSession && currentSession.title === "New Chat") {
      const title =
        lastMessage.content.split(" ").slice(0, 5).join(" ") +
        (lastMessage.content.split(" ").length > 5 ? "..." : "");
      await updateSessionTitle(sessionId, title || "Chat Session");
    }
  }

  // Robustly extract content for storage
  const content =
    lastMessage.content ||
    (Array.isArray(lastMessage.parts)
      ? lastMessage.parts.find((p: { type: string }) => p.type === "text")?.text
      : "") ||
    "";

  // Save user message
  await saveMessage(sessionId, lastMessage.role, content, "text");

  // Sanitize messages for streamText
  const sanitizedMessages = messages.map(
    (m: { role: string; content?: string; parts?: unknown[] }) => ({
      role: m.role,
      content: m.content || "",
      ...(m.parts ? { parts: m.parts } : {}),
    })
  );

  const result = streamText({
    model: openai("gpt-4o"),
    messages: sanitizedMessages,
    system: `You are Ami, a powerful AI SSH assistant. 
    You have direct access to the user's server terminal via the 'executeCommand' tool.
    
    GUIDELINES:
    1. If the user asks for information about the system (e.g., "how much ram", "list files", "who is logged in"), USE the 'executeCommand' tool.
    2. If the user asks for a specific command to be run, execute it immediately.
    3. After receiving command output, explain it briefly and humanely.
    4. Provide the raw output when it's helpful for reference.
    5. Be proactive, concise, and professional.`,
    tools: {
      executeCommand: {
        description: "Execute a shell command on the server via SSH",
        inputSchema: z.object({
          command: z.string().describe("The shell command to execute"),
        }),
        execute: async ({ command }: { command: string }) => {
          const ssh = new SSHService({
            host: process.env.SSH_HOST || "localhost",
            port: Number(process.env.SSH_PORT) || 22,
            username: process.env.SSH_USER || "root",
            password: process.env.SSH_PASSWORD,
            privateKey: process.env.SSH_KEY,
          });

          try {
            const output = await ssh.executeCommand(command);

            // Save the command and result to DB for history
            await saveMessage(sessionId, "user", command, "command");
            await saveMessage(sessionId, "assistant", output, "result");

            return { output, command };
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { error: errorMessage, command };
          }
        },
      },
    },
    // We use stopWhen to allow multiple tool calls up to 5 steps
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }: { text?: string }) => {
      if (text) {
        await saveMessage(sessionId, "assistant", text, "text");
      }
    },
  });

  return result.toTextStreamResponse();
}
