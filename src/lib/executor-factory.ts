import { SSHService, SSHConfig } from "./ssh-service";
import { LocalService, Executor } from "./executor-service";

export function getExecutor(logger?: (msg: string) => void): Executor {
	const mode = process.env.MODE || "ssh";

	if (mode === "native") {
		return new LocalService(logger);
	}

	const sshConfig: SSHConfig = {
		host: process.env.SSH_HOST || "localhost",
		port: Number(process.env.SSH_PORT) || 22,
		username: process.env.SSH_USER || "root",
		password: process.env.SSH_PASSWORD,
		privateKey: process.env.SSH_KEY,
	};

	return new SSHService(sshConfig, logger);
}
