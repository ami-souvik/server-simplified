"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ChatContextType {
	refreshKey: number;
	triggerRefresh: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [refreshKey, setRefreshKey] = useState(0);

	const triggerRefresh = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
	}, []);

	return (
		<ChatContext.Provider value={{ refreshKey, triggerRefresh }}>
			{children}
		</ChatContext.Provider>
	);
};

export const useChatContext = () => {
	const context = useContext(ChatContext);
	if (context === undefined) {
		throw new Error("useChatContext must be used within a ChatProvider");
	}
	return context;
};
