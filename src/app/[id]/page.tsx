"use client";

import { useParams } from "next/navigation";
import { ChatMessages } from "@/components/chat/ChatMessages";

export default function SessionPage() {
	const params = useParams();
	const id = params?.id as string;

	return <ChatMessages sessionId={id} />;
}
