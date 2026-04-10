"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
	thinking: string;
	workedSeconds?: number;
	thinkSeconds?: number;
	isStreaming?: boolean;
}

const formatSecs = (s?: number) => (s !== undefined ? `${s}s` : null);

const CollapseRow: React.FC<{
	label: string;
	sublabel?: string;
	isStreaming?: boolean;
	indentLevel?: number;
	children?: React.ReactNode;
	defaultOpen?: boolean;
}> = ({ label, sublabel, isStreaming = false, indentLevel = 0, children, defaultOpen = true }) => {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className={cn("w-full", indentLevel > 0 && "pl-4 border-l border-zinc-800/60 ml-1")}>
			<button
				onClick={() => setOpen((p) => !p)}
				className="flex items-center gap-1.5 py-1 text-left w-full group/toggle"
			>
				{isStreaming ? (
					<Loader2 size={11} className="text-zinc-500 animate-spin shrink-0" />
				) : open ? (
					<ChevronDown
						size={11}
						className="text-zinc-500 shrink-0 transition-transform"
					/>
				) : (
					<ChevronRight
						size={11}
						className="text-zinc-500 shrink-0 transition-transform"
					/>
				)}
				<span
					className={cn(
						"text-xs font-medium transition-colors",
						indentLevel === 0 ? "text-zinc-400" : "text-zinc-500"
					)}
				>
					{label}
					{sublabel && <span className="text-zinc-600 font-normal ml-1">{sublabel}</span>}
				</span>
			</button>

			{open && children && <div className="mt-0.5 mb-2">{children}</div>}
		</div>
	);
};

const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
	thinking,
	workedSeconds,
	thinkSeconds,
	isStreaming = false,
}) => {
	const workedLabel =
		workedSeconds !== undefined ? `Worked for ${formatSecs(workedSeconds)}` : "Working...";
	const thoughtLabel =
		thinkSeconds !== undefined ? `Thought for ${formatSecs(thinkSeconds)}` : "Thinking...";

	return (
		<div className="my-1 w-full">
			<CollapseRow label={workedLabel} isStreaming={isStreaming} defaultOpen={true}>
				<CollapseRow
					label={thoughtLabel}
					isStreaming={isStreaming && !thinkSeconds}
					indentLevel={1}
					defaultOpen={true}
				>
					<div className="mt-1 pl-1">
						<pre className="text-[11px] text-zinc-500 whitespace-pre-wrap leading-relaxed font-mono max-h-72 overflow-y-auto">
							{thinking}
						</pre>
					</div>
				</CollapseRow>
			</CollapseRow>
		</div>
	);
};

export default ThinkingBlock;
