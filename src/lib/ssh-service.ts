import { Client } from "ssh2";

export interface SSHConfig {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
}

export class SSHService {
    private config: SSHConfig;

    constructor(config: SSHConfig) {
        this.config = config;
    }

    async executeCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const conn = new Client();
            conn.on("ready", () => {
                let output = "";
                // Request pty to allow sudo to run
                conn.exec(command, { pty: true }, (err, stream) => {
                    if (err) {
                        conn.end();
                        return reject(err);
                    }
                    stream
                        .on("data", (data: Buffer) => {
                            const chunk = data.toString();
                            output += chunk;

                            // Handle sudo password prompt if it appears and we have a password
                            if (this.config.password && /\[sudo\] password for .*:/.test(chunk)) {
                                stream.write(this.config.password + "\n");
                            }
                        })
                        .on("close", (code: number, signal: string) => {
                            conn.end();
                            // Clean up any trailing password prompts from output if possible
                            // but usually it's fine for dev tools.
                            resolve(output);
                        })
                        .stderr.on("data", (data: Buffer) => {
                            output += data.toString();
                        });
                });
            })
                .on("error", (err) => {
                    reject(err);
                })
                .connect(this.config);
        });
    }

    async executeOllama(prompt: string, model: string = "llama3"): Promise<string> {
        // Escape double quotes in the prompt
        const escapedPrompt = prompt.replace(/"/g, '\\"');
        const command = `ollama run ${model} "${escapedPrompt}"`;
        return this.executeCommand(command);
    }
}
