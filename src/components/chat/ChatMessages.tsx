"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, User, Terminal, Cpu } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import TerminalOutput from "./TerminalOutput";
import { useChatState } from "@/lib/contexts/ChatStateContext";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	type: "text" | "command" | "result";
	createdAt?: string | Date;
}

interface ChatMessagesProps {
	sessionId: string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ sessionId }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { assistEnabled, triggerRefresh, isMobile } = useChatState();
	const scrollRef = useRef<HTMLDivElement>(null);

	// Load historical messages
	useEffect(() => {
		const loadMessages = async () => {
			try {
				const res = await fetch(`/api/messages?sessionId=${sessionId}`);
				const data = await res.json();
				if (Array.isArray(data)) {
					setMessages(data);
				}
			} catch (error) {
				console.error("Failed to load messages:", error);
			}
		};
		loadMessages();
	}, [sessionId]);

	// Auto-scroll
	useEffect(() => {
		if (scrollRef.current) {
			const scrollContainer =
				scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") ||
				scrollRef.current;
			if (scrollContainer) {
				scrollContainer.scrollTo({
					top: scrollContainer.scrollHeight,
					behavior: "smooth",
				});
			}
		}
	}, [messages, isLoading]);

	const handleSend = async (textOverride?: string) => {
		const text = textOverride || input;
		if (!text.trim() || isLoading) return;

		// 1. Optimistically add user message
		const userMsg: Message = {
			id: uuidv4(),
			role: "user",
			content: text,
			type: "text",
			createdAt: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setIsLoading(true);

		try {
			// 2. Custom fetch call (not using useChat)
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [...messages, userMsg],
					id: sessionId,
					assistEnabled,
				}),
			});

			if (!response.ok) throw new Error("Failed to get response");

			// The backend now returns raw text
			const replyText = await response.text();

			// 3. Since the backend handles saving to DB, we can just refresh our list
			// or add the final message manually for instant feedback.
			const assistantMsg: Message = {
				id: uuidv4(),
				role: "assistant",
				content: replyText,
				type: "text",
				createdAt: new Date().toISOString(),
			};

			// Refresh fully from DB to get actual IDs and tool results
			const finalRes = await fetch(`/api/messages?sessionId=${sessionId}`);
			const finalData = await finalRes.json();
			setMessages(finalData);

			triggerRefresh();
		} catch (error) {
			console.error("Chat Error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-full bg-[#09090B]">
			<ScrollArea ref={scrollRef} className="flex-1 px-3 md:px-4 py-4 md:py-6">
				<div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
					{messages.map((m) => (
						<div
							key={m.id}
							className={cn(
								"flex gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
								m.role === "user" ? "flex-row-reverse" : "flex-row"
							)}
						>
							<div
								className={cn(
									"w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0",
									m.role === "user"
										? "bg-zinc-800"
										: "bg-zinc-900 border border-zinc-800"
								)}
							>
								{m.role === "user" ? (
									<User size={14} className="text-zinc-400" />
								) : m.type === "command" ? (
									<Terminal size={14} className="text-blue-400" />
								) : (
									<Cpu size={14} className="text-zinc-400" />
								)}
							</div>

							<div
								className={cn(
									"flex flex-col gap-1.5 md:gap-2 max-w-[90%] md:max-w-[85%]",
									m.role === "user" ? "items-end" : "items-start"
								)}
							>
								{m.type === "result" ? (
									<div className="w-full overflow-x-auto text-xs md:text-sm">
										<TerminalOutput
											output={m.content}
											command="Command Result"
										/>
									</div>
								) : (
									<div
										className={cn(
											"px-3 py-1.5 text-sm md:text-[15px] leading-relaxed",
											m.role === "user"
												? "bg-zinc-100 text-zinc-900 font-medium rounded-lg"
												: "text-zinc-100 font-serif"
										)}
									>
										{m.content}
									</div>
								)}
							</div>
						</div>
					))}

					{isLoading && (
						<div className="flex gap-3 md:gap-4 animate-pulse">
							<div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
								<Cpu size={14} className="text-zinc-600" />
							</div>
							<div className="flex items-center gap-2 text-zinc-500 text-xs md:text-sm italic">
								<Loader2 size={12} className="animate-spin" />
								Shmart is thinking...
							</div>
						</div>
					)}
				</div>
			</ScrollArea>

			<div className="p-3 md:p-4 border-t border-zinc-900 bg-[#09090B]">
				<div className="max-w-3xl mx-auto relative group">
					<input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSend();
						}}
						placeholder="Message Shmart..."
						className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 text-sm md:text-base rounded-2xl py-3 md:py-4 pl-4 md:pl-6 pr-12 md:pr-14 focus:outline-none focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-600 transition-all group-focus-within:bg-zinc-900"
					/>
					<button
						onClick={() => handleSend()}
						disabled={!input.trim() || isLoading}
						className={cn(
							"absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
							input.trim() && !isLoading
								? "bg-zinc-100 text-zinc-950"
								: "text-zinc-600"
						)}
					>
						{isLoading ? (
							<Loader2 className="animate-spin" size={isMobile ? 18 : 20} />
						) : (
							<Send size={isMobile ? 18 : 20} />
						)}
					</button>
				</div>
				<p className="text-center text-[9px] md:text-[10px] text-zinc-600 mt-2 md:mt-3 uppercase tracking-widest font-medium">
					System operations via SSH • Autonomous Agent Active
				</p>
			</div>
		</div>
	);
};

export default ChatMessages;
