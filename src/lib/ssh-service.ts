import { Client } from "ssh2";
import { Executor } from "./executor-service";

export interface SSHConfig {
	host: string;
	port: number;
	username: string;
	password?: string;
	privateKey?: string;
}

export class SSHService implements Executor {
	private config: SSHConfig;
	private logger: (msg: string) => void;

	constructor(config: SSHConfig, logger?: (msg: string) => void) {
		this.config = config;
		this.logger = logger || ((msg) => console.log(msg));
	}

	async executeCommand(command: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const conn = new Client();
			conn.on("ready", () => {
				this.logger(
					`[SSH] Executing: "${command.slice(0, 50)}${command.length > 50 ? "..." : ""}"`
				);
				let output = "";
				conn.exec(command, { pty: true }, (err, stream) => {
					if (err) {
						this.logger(`[SSH] Execution error: ${err.message}`);
						conn.end();
						return reject(err);
					}
					stream
						.on("data", (data: Buffer) => {
							const chunk = data.toString();
							output += chunk;
							if (this.config.password && /\[sudo\] password for .*:/.test(chunk)) {
								stream.write(this.config.password + "\n");
							}
						})
						.on("close", () => {
							conn.end();
							resolve(output);
						})
						.stderr.on("data", (data: Buffer) => {
							output += data.toString();
						});
				});
			})
				.on("error", (err) => reject(err))
				.connect(this.config);
		});
	}

	async executeCommandStream(
		command: string,
		onData: (data: string) => void,
		usePty: boolean = true
	): Promise<void> {
		const startTime = Date.now();
		return new Promise((resolve, reject) => {
			const conn = new Client();
			conn.on("ready", () => {
				this.logger(
					`[SSH] Connection ready. Executing: "${command.slice(0, 50)}${
						command.length > 50 ? "..." : ""
					}"`
				);

				conn.exec(command, { pty: usePty }, (err, stream) => {
					if (err) {
						this.logger(`[SSH] Execution initiation error: ${err.message}`);
						conn.end();
						return reject(err);
					}

					this.logger("[SSH] Stream opened, waiting for data...");

					stream
						.on("data", (data: Buffer) => {
							const chunk = data.toString();
							// Strip ANSI escape codes and terminal controls
							const cleanChunk = chunk.replace(
								/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
								""
							);

							if (cleanChunk) {
								onData(cleanChunk);
							}

							if (this.config.password && /\[sudo\] password for .*:/.test(chunk)) {
								this.logger("[SSH] Sudo password prompt detected");
								stream.write(this.config.password + "\n");
							}
						})
						.on("close", (code: number, signal: string) => {
							const duration = ((Date.now() - startTime) / 1000).toFixed(2);
							this.logger(
								`[SSH] Stream closed after ${duration}s (code: ${code}, signal: ${signal})`
							);
							conn.end();
							resolve();
						})
						.on("error", (err: Error) => {
							this.logger(`[SSH] Stream error: ${err.message}`);
						});

					stream.stderr.on("data", (data: Buffer) => {
						const errStr = data.toString();
						const hasPrintableText = /[a-zA-Z0-9]/.test(errStr);
						if (hasPrintableText && errStr.trim()) {
							this.logger(`[SSH STDERR] ${errStr.trim()}`);
						}
					});
				});
			})
				.on("error", (err) => {
					this.logger(`[SSH] Global connection error: ${err.message}`);
					reject(err);
				})
				.connect(this.config);
		});
	}

	async executeOllamaStream(
		prompt: string,
		onData: (data: string) => void,
		model: string = process.env.OLLAMA_MODEL_NAME || "llama3"
	): Promise<void> {
		// We use a base64 pipe to safely pass complex multiline prompts through SSH/Shell
		const base64Prompt = Buffer.from(prompt).toString("base64");
		const command = `echo "${base64Prompt}" | base64 -d | ollama run ${model}`;
		// IMPORTANT: we use usePty: false here to stop ANSI escape codes from cluttering the AI response
		return this.executeCommandStream(command, onData, false);
	}

	async executeOllama(
		prompt: string,
		model: string = process.env.OLLAMA_MODEL_NAME || "llama3"
	): Promise<string> {
		// Escape double quotes in the prompt
		const escapedPrompt = prompt.replace(/"/g, '\\"');
		const command = `ollama run --temperature ${process.env.OLLAMA_MODEL_TEMP || "0.7"} ${model} "${escapedPrompt}"`;
		return this.executeCommand(command);
	}
}
