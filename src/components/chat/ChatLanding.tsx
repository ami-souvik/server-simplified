"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { useChatContext } from "@/lib/contexts/ChatContext";
import { useRouter } from "next/navigation";

interface ChatLandingProps {
  sessionId: string;
}

export const ChatLanding = ({ sessionId }: ChatLandingProps) => {
  const [input, setInput] = useState("");
  const [assistEnabled, setAssistEnabled] = useState(true);
  const { triggerRefresh } = useChatContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const { sendMessage } = useChat<UIMessage>({
    id: sessionId,
    api: "/api/chat",
    body: { assistEnabled },
    onFinish: () => {
      triggerRefresh();
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({ text: input, metadata: { assistEnabled } });
    setInput("");
    router.push(`/${sessionId}`);
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, [sessionId]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl text-center"
      >
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-8 tracking-tight">
          What can I help you build?
        </h1>

        <ChatInput
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          assistEnabled={assistEnabled}
          setAssistEnabled={setAssistEnabled}
          textareaRef={textareaRef}
        />

        <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-600 uppercase tracking-widest mt-4 justify-center">
          Full System Intelligence Enabled <ChevronDown size={12} className="-rotate-90" />
        </div>
      </motion.div>
    </div>
  );
};
