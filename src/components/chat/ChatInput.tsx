"use client";

import React from "react";
import { Plus, Sparkles, ChevronDown, Mic } from "lucide-react";

interface ChatInputProps {
	input: string;
	onInputChange: (value: string) => void;
	onSend: () => void;
	assistEnabled: boolean;
	setAssistEnabled: (value: boolean) => void;
	textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const ChatInput = ({
	input,
	onInputChange,
	onSend,
	assistEnabled,
	setAssistEnabled,
	textareaRef,
}: ChatInputProps) => {
	return (
		<div className="max-w-3xl mx-auto relative bg-[#2F2F2F] rounded-2xl border border-[#313131] shadow-xl overflow-hidden focus-within:border-[#414141] transition-all">
			<textarea
				ref={textareaRef}
				value={input}
				onChange={(e) => onInputChange(e.target.value)}
				placeholder="Message Shmart..."
				className="w-full bg-transparent border-none focus:ring-0 text-[#ECECEC] placeholder:text-zinc-500 px-5 pt-4 pb-12 resize-none max-h-[200px] text-base font-inter"
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						onSend();
					}
				}}
				rows={1}
			/>
			<div className="absolute bottom-3 left-3 flex gap-2">
				<button className="p-1.5 text-zinc-500 hover:text-white transition-colors">
					<Plus size={18} />
				</button>
				<button
					onClick={() => setAssistEnabled(!assistEnabled)}
					className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${assistEnabled ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-zinc-800 text-zinc-500 border-white/5"}`}
				>
					<Sparkles size={12} />
					Local Reasoning: {assistEnabled ? "On" : "Off"}
				</button>
			</div>
			<div className="absolute bottom-3 right-3 flex items-center gap-3">
				<button className="flex items-center gap-1.5 px-2.5 py-1 bg-black/20 hover:bg-black/40 rounded-lg text-xs font-medium text-zinc-400 transition-all border border-white/5">
					Shmart v1.5 <ChevronDown size={14} />
				</button>
				<button className="p-1.5 text-zinc-500 hover:text-white transition-colors">
					<Mic size={18} />
				</button>
			</div>
		</div>
	);
};
