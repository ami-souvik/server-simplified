"use client";

import React from "react";

interface TerminalOutputProps {
    content: string;
    command?: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ content, command }) => {
    return (
        <div className="text-zinc-300 font-mono rounded-2xl shadow-xl overflow-x-auto border border-white/5 group">
            {command && (
                <div className="flex items-center gap-2 text-zinc-500 border-b border-white/5 pt-1 px-4">
                    <span className="text-zinc-600 font-bold">$</span>
                    <span className="text-[13px]">{command}</span>
                </div>
            )}
            <pre className="whitespace-pre-wrap leading-relaxed text-[13px] font-medium selection:bg-zinc-800">
                {content || "No output"}
            </pre>
        </div>
    );
};
