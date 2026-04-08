"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Cpu, Terminal, Shield } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { useChatState } from "@/lib/contexts/ChatStateContext";

interface ChatLandingProps {
	sessionId?: string;
}

const ChatLanding: React.FC<ChatLandingProps> = ({ sessionId: propSessionId }) => {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { assistEnabled } = useChatState();

	const handleStartChat = async () => {
		if (!input.trim() || isLoading) return;

		setIsLoading(true);
		const newSessionId = propSessionId || uuidv4();

		try {
			// Send first message to initialize
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [{ role: "user", content: input }],
					id: newSessionId,
					assistEnabled,
				}),
			});

			if (!response.ok) throw new Error("Failed to start chat");

			// Redirect to chat page
			router.push(`/${newSessionId}`);
		} catch (error) {
			console.error("Failed to initiate chat:", error);
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-full px-4 lg:px-6 max-w-4xl mx-auto text-center py-12 md:py-20 overflow-y-auto">
			<div className="mb-8 md:mb-12 space-y-4">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] md:text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2 md:mb-4">
					<div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
					Local AI Reasoning Active
				</div>
				<h1 className="text-4xl md:text-7xl font-bold text-zinc-100 tracking-tight">
					Meet <span className="text-blue-500">Ami</span>.
				</h1>
				<p className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed px-2">
					Your autonomous SSH assistant. Execute system tasks, debug servers, and manage
					infrastructure through natural language.
				</p>
			</div>

			<div className="w-full max-w-2xl relative group mb-12 md:mb-16">
				<div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[24px] blur opacity-25 group-focus-within:opacity-50 transition-opacity" />
				<div className="relative">
					<input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleStartChat()}
						placeholder="E.g. Check server disk space or analyze logs..."
						className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-[22px] py-4 md:py-6 pl-6 md:pl-8 pr-14 md:pr-16 text-base md:text-lg focus:outline-none focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-600 transition-all shadow-2xl"
					/>
					<button
						onClick={handleStartChat}
						disabled={!input.trim() || isLoading}
						className={cn(
							"absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-2xl transition-all",
							input.trim() && !isLoading
								? "bg-zinc-100 text-zinc-950 scale-100"
								: "text-zinc-700 scale-90"
						)}
					>
						{isLoading ? (
							<Loader2 className="animate-spin" size={20} />
						) : (
							<Send size={20} />
						)}
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
				{[
					{
						icon: Terminal,
						label: "Shell Execution",
						desc: "Native SSH command capability",
					},
					{ icon: Cpu, label: "Autonomous", desc: "Self-correcting task loops" },
					{ icon: Shield, label: "Secure", desc: "Direct encrypted connection" },
				].map((feat, i) => (
					<div
						key={i}
						className="p-5 md:p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 text-left hover:bg-zinc-900/60 transition-colors"
					>
						<feat.icon size={18} className="text-blue-500 mb-2 md:mb-3" />
						<div className="text-zinc-100 font-semibold mb-1 text-sm md:text-base">
							{feat.label}
						</div>
						<div className="text-xs md:text-sm text-zinc-500">{feat.desc}</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default ChatLanding;
