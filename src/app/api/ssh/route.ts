import { saveMessage } from "@/lib/db/actions";
import { getExecutor } from "@/lib/executor-factory";

export async function POST(req: Request) {
	try {
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

		const executor = getExecutor();

		let currentTurn = 1;
		let finalReply = "";
		let currentPrompt = `You are Shmart, an AI SSH assistant. 
1. To run a server command, use: [ACTION]: your_command
2. To speak to the user, ALWAYS use: [REPLY]: your_message
3. Keep it simple and direct.\nAssistant: [THOUGHT]`;

		const history = ((messages || []) as { role: string; content?: string }[])
			.slice(-3)
			.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content || ""}`)
			.join("\n");

		if (history) {
			currentPrompt = `History:\n${history}\n\n${currentPrompt}`;
		}

		while (currentTurn < 5) {
			console.log(`[SSH Sync] Turn ${currentTurn}...`);
			let currentTurnOutput = "";

			await executor.executeOllamaStream(currentPrompt, (chunk: string) => {
				currentTurnOutput += chunk;
			});

			const actionMatch = currentTurnOutput.match(/\[ACTION\]:?\s*(.*)/i);
			if (actionMatch && actionMatch[1]) {
				const actionCommand = actionMatch[1].trim();
				const result = await executor.executeCommand(actionCommand);
				await saveMessage(sessionId, "user", actionCommand, "command");
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

		return new Response(cleanReply, {
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("[SSH Sync] Error:", error);
		return new Response(`Error: ${errorMessage}`, { status: 500 });
	}
}
