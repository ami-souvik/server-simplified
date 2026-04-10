import { saveMessage } from "@/lib/db/actions";
import { logDebug, logSystem } from "@/lib/debug-logger";
import { getExecutor } from "@/lib/executor-factory";
import { ensureMigration } from "@/lib/db/migrate";
import SYSTEM_PROMPT from "@/lib/system-prompt";

export async function POST(req: Request) {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			try {
				// Ensure migrations have run before handling any requests
				await ensureMigration();

				const { messages, id: sessionId } = await req.json();

				if (!sessionId) {
					controller.enqueue(encoder.encode("Error: Session ID required"));
					controller.close();
					return;
				}

				// Save the incoming user message
				const lastMessage = messages[messages.length - 1];
				if (lastMessage && lastMessage.role === "user") {
					await saveMessage(sessionId, "user", lastMessage.content || "");
				}

				logSystem(sessionId, `[Stream Agent] Session: ${sessionId}`);
				const executor = getExecutor((msg) => logSystem(sessionId, msg));

				let currentTurn = 1;
				let currentPrompt = SYSTEM_PROMPT;

				const history = ((messages as { role: string; content?: string }[]) || [])
					.slice(-5)
					.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content || ""}`)
					.join("\n");

				if (history) {
					currentPrompt = `History:\n${history}\n\n${currentPrompt}`;
				}

				// Execute reasoning loop
				while (currentTurn < 5) {
					logSystem(sessionId, `[Stream Agent] Turn ${currentTurn}...`);
					let currentTurnOutput = "";

					// Stream the LLM response for this turn
					await executor.executeOllamaStream(currentPrompt, (chunk: string) => {
						currentTurnOutput += chunk;
						controller.enqueue(encoder.encode(chunk));
					});

					// Log debug info
					logDebug({
						model: process.env.OLLAMA_MODEL_NAME || "llama3",
						systemPrompt: currentPrompt,
						messages: messages,
						response: currentTurnOutput,
						sessionId: sessionId,
						turn: currentTurn,
					});

					// Detect Action
					const actionMatch = currentTurnOutput.match(/\[ACTION\]:?\s*(.*)/i);
					if (actionMatch && actionMatch[1]) {
						const actionCommand = actionMatch[1].trim();

						// Stream a separator or status for the action
						controller.enqueue(encoder.encode("\n⏳ Executing command...\n"));

						const result = await executor.executeCommand(actionCommand);

						// Save intermediate steps to DB
						await saveMessage(sessionId, "assistant", actionCommand, "command");
						await saveMessage(sessionId, "assistant", result, "result");

						const observation = `\n[OBSERVATION]: ${result}\n`;

						// Stream the observation back to the user
						controller.enqueue(encoder.encode(observation));

						// Update prompt for the next turn
						currentPrompt += `${currentTurnOutput}${observation}[THOUGHT]`;
						currentTurn++;
					} else {
						// Extract and save final reply or thought
						const replyMatch = currentTurnOutput.match(/\[REPLY\]:?\s*([\s\S]*)$/i);
						const finalText = replyMatch
							? replyMatch[1].trim()
							: currentTurnOutput.trim();

						await saveMessage(sessionId, "assistant", finalText);
						break;
					}
				}

				controller.close();
			} catch (error: unknown) {
				console.error("[Stream Agent] Error:", error);
				const errorMessage = error instanceof Error ? error.message : String(error);
				controller.enqueue(encoder.encode(`\n[ERROR]: ${errorMessage}\n`));
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}
