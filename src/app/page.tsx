"use client";

import React, { useMemo } from "react";
import ChatLanding from "@/components/chat/ChatLanding";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
	// Generate a stable fresh session ID for the landing page
	const sessionId = useMemo(() => uuidv4(), []);
	return <ChatLanding sessionId={sessionId} />;
}
