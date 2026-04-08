"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { TerminalOutput } from "../terminal-output";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { useChatContext } from "@/lib/contexts/ChatContext";

interface ChatMessagesProps {
    sessionId: string;
}

export const ChatMessages = ({ sessionId }: ChatMessagesProps) => {
    const [assistEnabled, setAssistEnabled] = useState(true);
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { triggerRefresh } = useChatContext();

    const { messages, status, setMessages, sendMessage } = useChat<UIMessage>({
        id: sessionId,
        api: "/api/chat",
        body: { assistEnabled },
        onFinish: () => {
            triggerRefresh();
        },
    });

    useEffect(() => {
        const loadMessages = async () => {
            const res = await fetch(`/api/messages?sessionId=${sessionId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessages(data);
            }
        };
        loadMessages();
    }, [sessionId, setMessages]);

    const allMessages = (messages || []).sort(
        (a, b) =>
            (a.createdAt ? new Date(a.createdAt).getTime() : 0) -
            (b.createdAt ? new Date(b.createdAt).getTime() : 0)
    );

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [allMessages]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage({ text: input, metadata: { assistEnabled } });
        setInput("");
    };
    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#212121]">
            <header className="h-14 flex items-center justify-between px-6 border-b border-[#313131] shrink-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-zinc-300 truncate max-w-md">
                        {allMessages[0]?.text || "Active Conversation"}
                    </h2>
                    <ChevronDown size={14} className="text-zinc-500" />
                </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto py-10 px-6 space-y-10">
                    <AnimatePresence initial={false}>
                        {allMessages.map((m) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[90%] flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    {m.role === "user" ? (
                                        <div className="px-4 py-1.5 bg-zinc-950 text-[#ECECEC] rounded-xl text-base leading-relaxed font-inter">
                                            {m.content}
                                        </div>
                                    ) : (
                                        <div className="flex-1">
                                            {(m.content) && (
                                                <div className="text-[#ECECEC] text-base leading-relaxed font-inter prose prose-invert max-w-none">
                                                    {m.content}
                                                </div>
                                            )}

                                            {/* Handle tool invocations/results */}
                                            {m.type === "result" && (
                                                <div className="mt-2 w-full">
                                                    <TerminalOutput
                                                        content={m.content || ""}
                                                        command={m.command}
                                                    />
                                                </div>
                                            )}

                                            {m.toolInvocations?.map((toolInvocation: any) => {
                                                const { toolName, toolCallId, state } =
                                                    toolInvocation;
                                                if (state === "result") {
                                                    const { result } = toolInvocation;
                                                    return (
                                                        <div
                                                            key={toolCallId}
                                                            className="mt-4 w-full"
                                                        >
                                                            <TerminalOutput
                                                                content={result.output}
                                                                command={result.command}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div
                                                        key={toolCallId}
                                                        className="mt-4 flex items-center gap-2 text-zinc-500 text-sm italic"
                                                    >
                                                        <Loader2
                                                            size={16}
                                                            className="animate-spin"
                                                        />
                                                        Running server command...
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {status === "streaming" && (
                        <div className="flex justify-start gap-4">
                            <Loader2 className="animate-spin text-zinc-600" size={20} />
                            <span className="text-sm text-zinc-600 italic font-medium text-zinc-500">
                                Ami is thinking...
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 pt-2 shrink-0">
                <ChatInput
                    input={input}
                    onInputChange={setInput}
                    onSend={handleSend}
                    assistEnabled={assistEnabled}
                    setAssistEnabled={setAssistEnabled}
                    textareaRef={textareaRef}
                />
                <p className="text-[10px] text-zinc-600 text-center mt-3 font-medium">
                    System actions are executed via SSH as needed.
                </p>
            </div>
        </div>
    );
};
