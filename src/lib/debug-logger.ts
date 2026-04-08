import fs from "fs";
import path from "path";

export function logDebug(data: {
	model: string;
	systemPrompt: string;
	messages: unknown[];
	response: string;
	sessionId: string;
	turn: number;
}) {
	try {
		const logDir = path.join(process.cwd(), "logs", data.sessionId);
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}

		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `turn-${data.turn}-${timestamp}.txt`;
		const filePath = path.join(logDir, filename);

		const content = `================================================================================
MODEL NAME: ${data.model}
================================================================================

MENTION SYSTEM PROMPT:
${data.systemPrompt}

================================================================================

ALL MESSAGES (RAW):
${JSON.stringify(data.messages, null, 2)}

================================================================================

LLM RESPONSE:
${data.response}
================================================================================
`;

		fs.writeFileSync(filePath, content, "utf8");
		console.log(`[DEBUG LOG] Written to ${filePath}`);
	} catch (error) {
		console.error("[DEBUG LOG] Failed to write log:", error);
	}
}

export function logSystem(sessionId: string, message: string) {
	try {
		const logDir = path.join(process.cwd(), "logs", sessionId, "system");
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}

		const filename = `system-log.txt`;
		const filePath = path.join(logDir, filename);

		const timestamp = new Date().toISOString();
		const logEntry = `[${timestamp}] ${message}\n`;

		fs.appendFileSync(filePath, logEntry, "utf8");
	} catch (error) {
		// If logging fails, we still want to see it in the console for now
		console.error("[SYSTEM LOG] Failed to write system log:", error);
	}
}
