"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ChatStateContextType {
	refreshKey: number;
	triggerRefresh: () => void;
	assistEnabled: boolean;
	setAssistEnabled: (enabled: boolean) => void;
	isSidebarOpen: boolean; // For mobile
	setSidebarOpen: (open: boolean) => void;
	isSidebarCollapsed: boolean; // For desktop
	setSidebarCollapsed: (collapsed: boolean) => void;
	isMobile: boolean;
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [refreshKey, setRefreshKey] = useState(0);
	const [assistEnabled, setAssistEnabled] = useState(true);
	const [isSidebarOpen, setSidebarOpen] = useState(false);
	const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	React.useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 1024);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const triggerRefresh = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
	}, []);

	return (
		<ChatStateContext.Provider
			value={{
				refreshKey,
				triggerRefresh,
				assistEnabled,
				setAssistEnabled,
				isSidebarOpen,
				setSidebarOpen,
				isSidebarCollapsed,
				setSidebarCollapsed,
				isMobile,
			}}
		>
			{children}
		</ChatStateContext.Provider>
	);
};

export const useChatState = () => {
	const context = useContext(ChatStateContext);
	if (context === undefined) {
		throw new Error("useChatState must be used within a ChatProvider");
	}
	return context;
};
