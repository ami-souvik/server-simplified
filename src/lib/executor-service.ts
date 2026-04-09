import { spawn, exec } from "child_process";

export interface Executor {
	executeCommand(command: string): Promise<string>;
	executeCommandStream(
		command: string,
		onData: (data: string) => void,
		usePty?: boolean
	): Promise<void>;
	executeOllamaStream(
		prompt: string,
		onData: (data: string) => void,
		model?: string
	): Promise<void>;
	executeOllama(prompt: string, model?: string): Promise<string>;
}

export class LocalService implements Executor {
	private logger: (msg: string) => void;

	constructor(logger?: (msg: string) => void) {
		this.logger = logger || ((msg) => console.log(msg));
	}

	async executeCommand(command: string): Promise<string> {
		return new Promise((resolve, reject) => {
			this.logger(
				`[Local] Executing: "${command.slice(0, 50)}${command.length > 50 ? "..." : ""}"`
			);
			exec(command, (error, stdout, stderr) => {
				if (error) {
					this.logger(`[Local] Execution error: ${error.message}`);
					return resolve(stdout + stderr); // We resolve with output even on error for the AI to see
				}
				resolve(stdout + stderr);
			});
		});
	}

	async executeCommandStream(
		command: string,
		onData: (data: string) => void,
		usePty: boolean = true
	): Promise<void> {
		const startTime = Date.now();
		return new Promise((resolve, reject) => {
			this.logger(
				`[Local] Executing Stream: "${command.slice(0, 50)}${command.length > 50 ? "..." : ""}"`
			);

			// Note: usePty is ignored in basic LocalService for now to simplify,
			// though we could use 'node-pty' if we really needed it for local execution.
			const child = spawn("sh", ["-c", command]);

			child.stdout.on("data", (data: Buffer) => {
				const chunk = data.toString();
				const cleanChunk = chunk.replace(
					/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
					""
				);
				if (cleanChunk) onData(cleanChunk);
			});

			child.stderr.on("data", (data: Buffer) => {
				const errStr = data.toString();
				this.logger(`[Local STDERR] ${errStr.trim()}`);
				onData(errStr);
			});

			child.on("close", (code) => {
				const duration = ((Date.now() - startTime) / 1000).toFixed(2);
				this.logger(`[Local] Process closed after ${duration}s (code: ${code})`);
				resolve();
			});

			child.on("error", (err) => {
				this.logger(`[Local] Process error: ${err.message}`);
				reject(err);
			});
		});
	}

	async executeOllamaStream(
		prompt: string,
		onData: (data: string) => void,
		model: string = process.env.OLLAMA_MODEL_NAME || "llama3"
	): Promise<void> {
		const child = spawn("ollama", ["run", model]);

		child.stdin.write(prompt);
		child.stdin.end();

		return new Promise((resolve, reject) => {
			child.stdout.on("data", (data: Buffer) => {
				const chunk = data.toString();
				onData(chunk);
			});

			child.stderr.on("data", (data: Buffer) => {
				// Ollama stderr often contains progress bars or logs
				// Depending on config we might want to ignore or pipe them
			});

			child.on("close", (code) => {
				resolve();
			});

			child.on("error", (err) => {
				reject(err);
			});
		});
	}

	async executeOllama(
		prompt: string,
		model: string = process.env.OLLAMA_MODEL_NAME || "llama3"
	): Promise<string> {
		return new Promise((resolve, reject) => {
			const child = spawn("ollama", ["run", model]);
			let output = "";

			child.stdin.write(prompt);
			child.stdin.end();

			child.stdout.on("data", (data: Buffer) => {
				output += data.toString();
			});

			child.on("close", () => {
				resolve(output);
			});

			child.on("error", (err) => {
				reject(err);
			});
		});
	}
}
