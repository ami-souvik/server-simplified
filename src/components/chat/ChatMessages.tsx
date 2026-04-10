"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, User, Terminal, Cpu } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import TerminalOutput from "./TerminalOutput";
import ThinkingBlock from "./ThinkingBlock";
import { useChatState } from "@/lib/contexts/ChatStateContext";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	type: "text" | "command" | "result";
	createdAt?: string | Date;
}

interface MessageTiming {
	workedSeconds: number;
	thinkSeconds: number;
}

interface ParsedContent {
	thinking: string | null;
	reply: string;
}

interface ChatMessagesProps {
	sessionId: string;
}

const THINKING_START = /^Thinking\.\.\./im;
const THINKING_END_WORD = "...done thinking.";
const THINKING_END = /\.\.\.done thinking\./i;
const REPLY_PATTERN = /\[REPLY\]:?\s*([\s\S]*)$/i;

/**
 * Splits raw LLM output into a thinking block and a visible reply.
 * Handles both complete and partial (streaming) content, including multi-turn
 * responses that contain [ACTION] / [OBSERVATION] markers between thinking and reply.
 */
const parseContent = (raw: string, isStreaming: boolean): ParsedContent => {
	const hasThinkingStart = THINKING_START.test(raw.trimStart());

	if (!hasThinkingStart) {
		const replyMatch = raw.match(REPLY_PATTERN);
		return {
			thinking: null,
			reply: replyMatch ? replyMatch[1].trim() : raw.trim(),
		};
	}

	const doneIdx = raw.search(THINKING_END);

	if (isStreaming || doneIdx === -1) {
		// Still in mid-stream — whole content is "thinking"
		return { thinking: raw.trim(), reply: "" };
	}

	const thinkingContent = raw.slice(0, doneIdx + THINKING_END_WORD.length).trim();
	const afterThinking = raw.slice(doneIdx + THINKING_END_WORD.length);

	const replyMatch = afterThinking.match(REPLY_PATTERN);
	const replyText = replyMatch ? replyMatch[1].trim() : afterThinking.trim();

	return { thinking: thinkingContent, reply: replyText };
};

// ─────────────────────────────────────────────────────────────────────────────
// AssistantMessage: renders a single assistant bubble with optional thinking UI
// ─────────────────────────────────────────────────────────────────────────────
const AssistantMessage: React.FC<{
	content: string;
	type: "text" | "command" | "result";
	isStreaming?: boolean;
	timing?: MessageTiming;
}> = ({ content, type, isStreaming = false, timing }) => {
	if (type === "result") {
		return (
			<div className="w-full overflow-x-auto text-xs md:text-sm">
				<TerminalOutput output={content} command="Command Result" />
			</div>
		);
	}

	const { thinking, reply } = parseContent(content, isStreaming);

	return (
		<div className="flex flex-col gap-2 w-full">
			{thinking && (
				<ThinkingBlock
					thinking={thinking}
					workedSeconds={isStreaming ? undefined : timing?.workedSeconds}
					thinkSeconds={isStreaming ? undefined : timing?.thinkSeconds}
					isStreaming={isStreaming}
				/>
			)}

			{/* Final reply */}
			{reply ? (
				<div className="px-1 text-sm md:text-[15px] leading-relaxed whitespace-pre-line text-zinc-100 font-serif">
					{reply}
				</div>
			) : (
				/* Fallback: no thinking block, just render raw content */
				!thinking &&
				content && (
					<div className="px-1 text-sm md:text-[15px] leading-relaxed whitespace-pre-line text-zinc-100 font-serif">
						{content}
					</div>
				)
			)}
		</div>
	);
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const ChatMessages: React.FC<ChatMessagesProps> = ({ sessionId }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
	// Map of msgId → timing metadata for messages streamed in this session
	const [timings, setTimings] = useState<Map<string, MessageTiming>>(new Map());

	const { assistEnabled, triggerRefresh, isMobile } = useChatState();
	const scrollRef = useRef<HTMLDivElement>(null);

	// Load historical messages
	useEffect(() => {
		const loadMessages = async () => {
			try {
				const res = await fetch(`/api/messages?sessionId=${sessionId}`);
				const data = await res.json();
				if (Array.isArray(data)) setMessages(data);
			} catch (err) {
				console.error("Failed to load messages:", err);
			}
		};
		loadMessages();
	}, [sessionId]);

	// Auto-scroll
	useEffect(() => {
		if (scrollRef.current) {
			const el =
				scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") ||
				scrollRef.current;
			el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
		}
	}, [messages, isLoading]);

	const handleSend = async (textOverride?: string) => {
		const text = textOverride || input;
		if (!text.trim() || isLoading) return;

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

			const reader = response.body?.getReader();
			const textDecoder = new TextDecoder();
			if (!reader) throw new Error("No reader available");

			const assistantMsgId = uuidv4();
			setStreamingMsgId(assistantMsgId);
			setMessages((prev) => [
				...prev,
				{ id: assistantMsgId, role: "assistant", content: "", type: "text" },
			]);

			// ─── Timing trackers ───────────────────────────────────────────────────
			const workedStart = Date.now();
			let thinkStart: number | null = null;
			let thinkEnd: number | null = null;
			let accumulated = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = textDecoder.decode(value, { stream: true });
				accumulated += chunk;

				// Detect think block start
				if (thinkStart === null && THINKING_START.test(accumulated.trimStart())) {
					thinkStart = Date.now();
				}
				// Detect think block end
				if (thinkStart !== null && thinkEnd === null && THINKING_END.test(accumulated)) {
					thinkEnd = Date.now();
				}

				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === assistantMsgId ? { ...msg, content: accumulated } : msg
					)
				);
			}

			// ─── Compute and store timings ─────────────────────────────────────────
			const workedEnd = Date.now();
			const workedSeconds = Math.round((workedEnd - workedStart) / 1000);
			const thinkSeconds =
				thinkStart !== null ? Math.round(((thinkEnd ?? workedEnd) - thinkStart) / 1000) : 0;

			// Persist timing under the temp message ID (which stays in place)
			setTimings((prev) =>
				new Map(prev).set(assistantMsgId, { workedSeconds, thinkSeconds })
			);
			setStreamingMsgId(null);

			// ⚠️  We intentionally do NOT replace messages from DB here.
			// The streaming message already contains the full raw content (thinking + reply).
			// Replacing it would orphan the timing Map entry and lose the thinking block.
			// The sidebar session list is refreshed via triggerRefresh().
			triggerRefresh();
		} catch (err) {
			console.error("Chat Error:", err);
			setStreamingMsgId(null);
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
							{/* Avatar */}
							<div
								className={cn(
									"w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
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

							{/* Bubble */}
							<div
								className={cn(
									"flex flex-col gap-1.5 md:gap-2 max-w-[90%] md:max-w-[85%]",
									m.role === "user" ? "items-end" : "items-start w-full"
								)}
							>
								{m.role === "user" ? (
									<div className="px-3 py-1.5 text-sm md:text-[15px] leading-relaxed whitespace-pre-line bg-zinc-100 text-zinc-900 font-medium rounded-lg">
										{m.content}
									</div>
								) : (
									<AssistantMessage
										content={m.content}
										type={m.type}
										isStreaming={m.id === streamingMsgId}
										timing={timings.get(m.id)}
									/>
								)}
							</div>
						</div>
					))}

					{/* Brief skeleton before the streaming bubble appears */}
					{isLoading && !streamingMsgId && (
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

			{/* Input bar */}
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
