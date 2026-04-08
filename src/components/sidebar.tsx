"use client";

import React from "react";
import {
	Plus,
	Search,
	Settings2,
	MessageSquare,
	Box,
	FileCode,
	ChevronRight,
	Download,
	PanelLeftClose,
	MoreHorizontal,
	Star,
	Pencil,
	Layers,
	Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useParams, useRouter } from "next/navigation";
import { useChatState } from "@/lib/contexts/ChatStateContext";
import { cn } from "@/lib/utils";

interface Session {
	id: string;
	title: string;
	starred?: boolean;
}

export const Sidebar = () => {
	const params = useParams();
	const router = useRouter();
	const currentSessionId = (params?.id as string) || "default";
	const {
		refreshKey,
		triggerRefresh,
		isSidebarOpen,
		setSidebarOpen,
		isSidebarCollapsed,
		setSidebarCollapsed,
		isMobile,
	} = useChatState();

	const [sessions, setSessions] = React.useState<Session[]>([]);
	const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
	const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
	const [editTitle, setEditTitle] = React.useState("");

	const [mounted, setMounted] = React.useState(false);

	const fetchSessions = async () => {
		try {
			const res = await fetch("/api/sessions");
			const data = await res.json();
			if (Array.isArray(data)) {
				setSessions(data);
			}
		} catch (error) {
			console.error("Failed to fetch sessions:", error);
		}
	};

	React.useEffect(() => {
		setMounted(true);
		fetchSessions();
	}, [currentSessionId, refreshKey]);

	const handleNewChat = () => {
		const newId = crypto.randomUUID();
		router.push(`/${newId}`);
		setMenuOpenId(null);
		if (isMobile) setSidebarOpen(false); // Close on mobile after selection
	};

	const handleRename = async (id: string) => {
		if (!editTitle.trim()) {
			setEditingSessionId(null);
			return;
		}
		try {
			await fetch(`/api/sessions/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: editTitle }),
			});
			setEditingSessionId(null);
			triggerRefresh();
		} catch (error) {
			console.error("Failed to rename session:", error);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this chat?")) return;
		try {
			await fetch(`/api/sessions/${id}`, {
				method: "DELETE",
			});

			if (currentSessionId === id) {
				router.push("/");
			}

			setMenuOpenId(null);
			triggerRefresh();
		} catch (error) {
			console.error("Failed to delete session:", error);
		}
	};

	if (!mounted) return null;

	return (
		<>
			{/* Mobile Backdrop */}
			<AnimatePresence>
				{isSidebarOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setSidebarOpen(false)}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
					/>
				)}
			</AnimatePresence>

			<motion.div
				initial={false}
				animate={{
					width: isMobile ? 260 : isSidebarCollapsed ? 72 : 260,
					x: isSidebarOpen ? 0 : isMobile ? -260 : 0,
				}}
				transition={{ type: "spring", damping: 25, stiffness: 200 }}
				className={cn(
					"h-full bg-[#171717] flex flex-col border-r border-[#212121] transition-colors duration-300 z-50",
					"fixed top-0 left-0",
					isSidebarCollapsed && !isMobile ? "px-3" : "px-0"
				)}
			>
				{/* Header */}
				<div
					className={cn(
						"p-4 flex items-center justify-between",
						isSidebarCollapsed && "justify-center"
					)}
				>
					{!isSidebarCollapsed && (
						<h1 className="text-xl font-medium tracking-tight text-white font-serif">
							Shmart
						</h1>
					)}
					<button
						onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
						className="text-zinc-500 hover:text-white transition-colors"
					>
						<PanelLeftClose
							size={18}
							className={cn(
								"transition-transform",
								isSidebarCollapsed && "rotate-180"
							)}
						/>
					</button>
				</div>

				{/* Primary Actions */}
				<div
					className={cn(
						"px-2 space-y-1 mt-2",
						isSidebarCollapsed && "px-0 flex flex-col items-center"
					)}
				>
					<button
						onClick={handleNewChat}
						className={cn(
							"flex items-center gap-3 py-1.5 text-zinc-400 hover:bg-[#212121] rounded transition-all text-sm",
							isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full px-2"
						)}
						title="New Chat"
					>
						<div className="bg-[#212121] group-hover:bg-[#2f2f2f] p-0.5 rounded-md border border-white/5">
							<Plus size={16} />
						</div>
						{!isSidebarCollapsed && <span className="font-medium">New chat</span>}
					</button>
					<button
						className={cn(
							"flex items-center gap-3 py-1.5 text-zinc-400 hover:bg-[#212121] rounded transition-all text-sm",
							isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full px-2"
						)}
						title="Search"
					>
						<Search size={18} />
						{!isSidebarCollapsed && <span>Search</span>}
					</button>
					<button
						className={cn(
							"flex items-center gap-3 py-1.5 text-zinc-400 hover:bg-[#212121] rounded transition-all text-sm",
							isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full px-2"
						)}
						title="Customize"
					>
						<Settings2 size={18} />
						{!isSidebarCollapsed && <span>Customize</span>}
					</button>
				</div>

				{/* Main Nav */}
				<div
					className={cn(
						"px-2 space-y-1 mt-6",
						isSidebarCollapsed && "px-0 flex flex-col items-center"
					)}
				>
					<button
						className={cn(
							"flex items-center gap-3 py-1.5 bg-[#212121] text-white rounded transition-all text-sm",
							isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full px-2"
						)}
					>
						<MessageSquare size={18} />
						{!isSidebarCollapsed && <span>Chats</span>}
					</button>
					<button
						className={cn(
							"flex items-center gap-3 py-1.5 text-zinc-500 hover:bg-[#212121] rounded transition-all text-sm cursor-not-allowed",
							isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full px-2"
						)}
					>
						<Box size={18} />
						{!isSidebarCollapsed && <span>Projects</span>}
					</button>
					<button
						className={cn(
							"flex items-center gap-3 py-1.5 text-zinc-500 hover:bg-[#212121] rounded transition-all text-sm cursor-not-allowed",
							isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full px-2"
						)}
					>
						<FileCode size={18} />
						{!isSidebarCollapsed && <span>Artifacts</span>}
					</button>
				</div>

				{/* Recents */}
				<div className="flex-1 overflow-y-auto px-2 mt-8 space-y-4 scrollbar-hide">
					{!isSidebarCollapsed && (
						<div onMouseLeave={() => setMenuOpenId(null)}>
							<h3 className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider px-2.5 mb-2">
								Recents
							</h3>
							<div className="space-y-1">
								{sessions.map((session) => (
									<div key={session.id} className="relative group">
										{editingSessionId === session.id ? (
											<div className="px-2 py-1">
												<input
													autoFocus
													className="w-full bg-[#2F2F2F] text-white text-[13px] px-2 py-0.5 rounded border border-blue-500 focus:outline-none"
													value={editTitle}
													onChange={(e) => setEditTitle(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter")
															handleRename(session.id);
														if (e.key === "Escape")
															setEditingSessionId(null);
													}}
													onBlur={() => handleRename(session.id)}
												/>
											</div>
										) : (
											<>
												<button
													onClick={() => {
														router.push(`/${session.id}`);
														if (isMobile) setSidebarOpen(false);
													}}
													className={cn(
														"w-full text-left px-2 py-1.5 text-[13px] rounded truncate transition-colors pr-8",
														currentSessionId === session.id
															? "bg-[#212121] text-white"
															: "text-zinc-400 hover:bg-[#212121]"
													)}
												>
													{session.title}
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														setMenuOpenId(
															menuOpenId === session.id
																? null
																: session.id
														);
													}}
													className={cn(
														"absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-all",
														menuOpenId === session.id
															? "opacity-100 bg-white/5"
															: "opacity-0 group-hover:opacity-100 text-zinc-500"
													)}
												>
													<MoreHorizontal size={14} />
												</button>
											</>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div
					className={cn(
						"p-3 border-t border-[#212121] overflow-hidden hover:bg-[#212121] transition-all cursor-pointer group",
						isSidebarCollapsed ? "px-0 flex justify-center" : "px-4"
					)}
				>
					<div className={cn("flex items-center gap-3", isSidebarCollapsed && "gap-0")}>
						<div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-white/5 shrink-0">
							S
						</div>
						{!isSidebarCollapsed && (
							<div className="flex flex-col min-w-0">
								<span className="text-xs font-semibold text-white truncate">
									Souvik
								</span>
								<span className="text-[10px] text-zinc-500 font-medium truncate">
									Free plan
								</span>
							</div>
						)}
					</div>
				</div>
			</motion.div>
		</>
	);
};
