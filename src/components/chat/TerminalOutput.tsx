import React from "react";
import { Terminal } from "lucide-react";

interface TerminalOutputProps {
	output: string;
	command?: string;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ output, command }) => {
	return (
		<div className="w-full bg-black border border-zinc-800 rounded-lg overflow-hidden font-mono text-sm my-2">
			<div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
				<Terminal size={14} className="text-zinc-500" />
				<span className="text-zinc-400 text-xs truncate">{command || "Terminal"}</span>
			</div>
			<div className="p-4 text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-[400px]">
				{output}
			</div>
		</div>
	);
};

export default TerminalOutput;
