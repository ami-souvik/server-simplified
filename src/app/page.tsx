"use client";

import React, { useMemo } from "react";
import ChatLanding from "@/components/chat/ChatLanding";

export default function Home() {
	// Generate a stable fresh session ID for the landing page
	const sessionId = useMemo(() => crypto.randomUUID(), []);
	return <ChatLanding sessionId={sessionId} />;
}
