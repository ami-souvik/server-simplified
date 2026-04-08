"use client";

import React from "react";
import { Sidebar } from "@/components/sidebar";
import { ChatProvider } from "@/lib/contexts/ChatContext";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<ChatProvider>
			<div className="flex h-screen w-full bg-[#171717] overflow-hidden">
				<Sidebar />
				<main className="flex-1 flex flex-col h-full bg-[#212121] overflow-hidden">
					{children}
				</main>
			</div>
		</ChatProvider>
	);
};
