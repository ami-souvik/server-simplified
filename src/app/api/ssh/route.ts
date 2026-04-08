import { NextRequest, NextResponse } from "next/server";
import { SSHService } from "@/lib/ssh-service";
import { saveMessage } from "@/lib/db/actions";

export async function POST(req: NextRequest) {
  try {
    const {
      command,
      host,
      username,
      password,
      privateKey,
      sessionId = "default",
      assist = false,
    } = await req.json();

    const ssh = new SSHService({
      host: host || process.env.SSH_HOST || "localhost",
      port: Number(process.env.SSH_PORT) || 22,
      username: username || process.env.SSH_USER || "root",
      password: password || process.env.SSH_PASSWORD,
      privateKey: privateKey || process.env.SSH_KEY,
    });

    const output = await ssh.executeCommand(command);

    let explanation = "";
    if (assist && output.trim()) {
      try {
        explanation = await ssh.executeOllama(`Explain this terminal output briefly: ${output}`);
      } catch (e) {
        console.error("Ollama assistant failed:", e);
      }
    }

    // Save to DB
    await saveMessage(sessionId, "user", command, "command");
    await saveMessage(
      sessionId,
      "assistant",
      explanation || output,
      explanation ? "text" : "result"
    );
    if (explanation) {
      // If we have an explanation, we also save the raw result as a nested part or separate message
      await saveMessage(sessionId, "assistant", output, "result");
    }

    return NextResponse.json({ output, explanation });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
