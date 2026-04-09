import { saveMessage } from "@/lib/db/actions";
import { logDebug, logSystem } from "@/lib/debug-logger";
import { getExecutor } from "@/lib/executor-factory";
import { runMigrations } from "@/lib/db/migrate";
import SYSTEM_PROMPT from "@/lib/system-prompt";

let migrationPromise: Promise<void> | null = null;

export async function POST(req: Request) {
	try {
		// Ensure migrations have run before handling any requests
		if (
			!migrationPromise &&
			process.env.NODE_ENV === "production" &&
			!process.env.SKIP_DB_MIGRATE
		) {
			migrationPromise = runMigrations();
		}
		if (migrationPromise) {
			await migrationPromise;
		}

		const { messages, id: sessionId, assistEnabled } = await req.json();

		if (!sessionId) {
			return new Response("Session ID required", { status: 400 });
		}

		// Save the incoming user message
		const lastMessage = messages[messages.length - 1];
		if (lastMessage && lastMessage.role === "user") {
			const userContent = lastMessage.content || "";
			await saveMessage(sessionId, "user", userContent);
		}

		logSystem(sessionId, `[Custom Agent] Session: ${sessionId}`);

		const executor = getExecutor((msg) => logSystem(sessionId, msg));

		let currentTurn = 1;
		let finalReply = "";
		let currentPrompt = SYSTEM_PROMPT;

		const history = ((messages as { role: string; content?: string }[]) || [])
			.slice(-3)
			.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content || ""}`)
			.join("\n");

		if (history) {
			currentPrompt = `History:\n${history}\n\n${currentPrompt}`;
		}

		// Execute reasoning loop synchronously
		while (currentTurn < 5) {
			logSystem(sessionId, `[Custom Agent] Turn ${currentTurn}...`);
			let currentTurnOutput = "";

			await executor.executeOllamaStream(currentPrompt, (chunk: string) => {
				currentTurnOutput += chunk;
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

			// Extract and save Thought
			const thoughtMatch = currentTurnOutput.match(
				/\[THOUGHT\]:?\s*([\s\S]*?)(?=\[ACTION\]|\[REPLY\]|$)/i
			);
			if (thoughtMatch && thoughtMatch[1]) {
				await saveMessage(sessionId, "assistant", thoughtMatch[1].trim(), "thought");
			}

			const actionMatch = currentTurnOutput.match(/\[ACTION\]:?\s*(.*)/i);
			if (actionMatch && actionMatch[1]) {
				const actionCommand = actionMatch[1].trim();
				const result = await executor.executeCommand(actionCommand);
				await saveMessage(sessionId, "assistant", actionCommand, "command");
				await saveMessage(sessionId, "assistant", result, "result");

				currentPrompt += `${currentTurnOutput}\n[OBSERVATION]: ${result}\n[THOUGHT]`;
				currentTurn++;
			} else {
				finalReply =
					currentTurnOutput.match(/\[REPLY\]:?\s*([\s\S]*)$/i)?.[1] || currentTurnOutput;
				break;
			}
		}

		const cleanReply = finalReply.trim();
		await saveMessage(sessionId, "assistant", cleanReply);

		// RETURN RAW TEXT (Simple and effective)
		return new Response(cleanReply, {
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	} catch (error: unknown) {
		console.error("[Custom Agent] Error:", error);

		let errorMessage = "Unknown error";
		if (error instanceof Error) {
			errorMessage = error.message || error.name || "Error with no message";
			if (error.stack) {
				console.error("[Custom Agent] Stack:", error.stack);
			}
		} else {
			errorMessage = String(error);
		}

		return new Response(`Error: ${errorMessage}`, {
			status: 500,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}
}
