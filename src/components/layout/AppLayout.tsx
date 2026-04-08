"use client";

import React from "react";
import { Sidebar } from "@/components/sidebar";
import { ChatProvider, useChatState } from "@/lib/contexts/ChatStateContext";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

const AppLayoutInner = ({ children }: { children: React.ReactNode }) => {
	const { setSidebarOpen, isSidebarCollapsed, isMobile } = useChatState();

	return (
		<div className="flex h-screen w-full bg-[#171717] overflow-hidden relative">
			<Sidebar />
			<motion.main
				initial={false}
				animate={{
					paddingLeft: isMobile ? 0 : isSidebarCollapsed ? 72 : 260,
				}}
				className="flex-1 flex flex-col h-full bg-[#212121] overflow-hidden relative"
			>
				{/* Mobile Header */}
				<header className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-900 bg-[#09090B]">
					<button
						onClick={() => setSidebarOpen(true)}
						className="p-2 text-zinc-400 hover:text-white"
					>
						<Menu size={20} />
					</button>
					<h1 className="text-lg font-medium text-white font-serif">Ami</h1>
					<div className="w-10" /> {/* Spacer */}
				</header>
				<div className="flex-1 overflow-hidden">{children}</div>
			</motion.main>
		</div>
	);
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<ChatProvider>
			<AppLayoutInner>{children}</AppLayoutInner>
		</ChatProvider>
	);
};
