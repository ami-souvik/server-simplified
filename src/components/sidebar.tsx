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
import { useChatContext } from "@/lib/contexts/ChatContext";

interface Session {
	id: string;
	title: string;
	starred?: boolean;
}

export const Sidebar = () => {
	const params = useParams();
	const router = useRouter();
	const currentSessionId = (params?.id as string) || "default";
	const { refreshKey, triggerRefresh } = useChatContext();

	const [sessions, setSessions] = React.useState<Session[]>([]);
	const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
	const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
	const [editTitle, setEditTitle] = React.useState("");

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
		fetchSessions();
	}, [currentSessionId, refreshKey]);

	const handleNewChat = () => {
		const newId = crypto.randomUUID();
		router.push(`/${newId}`);
		setMenuOpenId(null);
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

	return (
		<div className="w-[260px] h-full bg-[#171717] flex flex-col border-r border-[#212121] relative z-20">
			{/* Header */}
			<div className="p-4 flex items-center justify-between">
				<h1 className="text-xl font-medium tracking-tight text-white font-serif">
					Ami SSH
				</h1>
				<button className="text-zinc-500 hover:text-white transition-colors">
					<PanelLeftClose size={18} />
				</button>
			</div>

			{/* Primary Actions */}
			<div className="px-2 space-y-1 mt-2">
				<button
					onClick={handleNewChat}
					className="w-full flex items-center gap-3 px-2 py-1 text-zinc-400 hover:bg-[#212121] rounded transition-all text-sm"
				>
					<div className="bg-[#212121] group-hover:bg-[#2f2f2f] p-0.5 rounded-md border border-white/5">
						<Plus size={16} />
					</div>
					<span className="font-medium">New chat</span>
				</button>
				<button className="w-full flex items-center gap-3 px-2 py-1 text-zinc-400 hover:bg-[#212121] rounded transition-all text-sm">
					<Search size={18} />
					<span>Search</span>
				</button>
				<button className="w-full flex items-center gap-3 px-2 py-1 text-zinc-400 hover:bg-[#212121] rounded transition-all text-sm">
					<Settings2 size={18} />
					<span>Customize</span>
				</button>
			</div>

			{/* Main Nav */}
			<div className="px-2 space-y-1 mt-6">
				<button className="w-full flex items-center gap-3 px-2 py-1 bg-[#212121] text-white rounded transition-all text-sm">
					<MessageSquare size={18} />
					<span>Chats</span>
				</button>
				<button className="w-full flex items-center gap-3 px-2 py-1 text-zinc-500 hover:bg-[#212121] rounded transition-all text-sm cursor-not-allowed">
					<Box size={18} />
					<span>Projects</span>
				</button>
				<button className="w-full flex items-center gap-3 px-2 py-1 text-zinc-500 hover:bg-[#212121] rounded transition-all text-sm cursor-not-allowed">
					<FileCode size={18} />
					<span>Artifacts</span>
				</button>
			</div>

			{/* Recents */}
			<div className="flex-1 overflow-y-auto px-2 mt-8 space-y-4 scrollbar-hide">
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
												if (e.key === "Enter") handleRename(session.id);
												if (e.key === "Escape") setEditingSessionId(null);
											}}
											onBlur={() => handleRename(session.id)}
										/>
									</div>
								) : (
									<>
										<button
											onClick={() => router.push(`/${session.id}`)}
											className={`w-full text-left px-2 py-1.5 text-[13px] rounded truncate transition-colors pr-8 ${
												currentSessionId === session.id
													? "bg-[#212121] text-white"
													: "text-zinc-400 hover:bg-[#212121]"
											}`}
										>
											{session.title}
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												setMenuOpenId(
													menuOpenId === session.id ? null : session.id
												);
											}}
											className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-all ${menuOpenId === session.id ? "opacity-100 bg-white/5" : "opacity-0 group-hover:opacity-100 text-zinc-500"}`}
										>
											<MoreHorizontal size={14} />
										</button>
									</>
								)}

								<AnimatePresence>
									{menuOpenId === session.id && (
										<motion.div
											initial={{ opacity: 0, scale: 0.95, y: -10 }}
											animate={{ opacity: 1, scale: 1, y: 0 }}
											exit={{ opacity: 0, scale: 0.95, y: -10 }}
											className="absolute right-2 top-8 w-48 bg-[#252525] border border-[#313131] rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden"
										>
											<button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-zinc-300 hover:bg-white/5 transition-colors opacity-50 cursor-not-allowed">
												<Star size={14} className="text-zinc-500" />
												<span>Star</span>
											</button>
											<button
												onClick={() => {
													setEditingSessionId(session.id);
													setEditTitle(session.title);
													setMenuOpenId(null);
												}}
												className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-zinc-300 hover:bg-white/5 transition-colors"
											>
												<Pencil size={14} className="text-zinc-500" />
												<span>Rename</span>
											</button>
											<button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-zinc-300 hover:bg-white/5 transition-colors opacity-50 cursor-not-allowed">
												<Layers size={14} className="text-zinc-500" />
												<span>Add to project</span>
											</button>
											<div className="h-[1px] bg-[#313131] my-1.5 mx-3" />
											<button
												onClick={() => {
													handleDelete(session.id);
													setMenuOpenId(null);
												}}
												className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
											>
												<Trash2 size={14} />
												<span>Delete</span>
											</button>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						))}
						{sessions.length === 0 && (
							<p className="px-2.5 text-[11px] text-zinc-600 italic">
								No previous chats
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="p-3 border-t border-[#212121]">
				<div className="flex items-center justify-between p-2 hover:bg-[#212121] rounded-xl transition-all cursor-pointer group">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-white/5">
							S
						</div>
						<div className="flex flex-col">
							<span className="text-xs font-semibold text-white">Souvik</span>
							<span className="text-[10px] text-zinc-500 font-medium">Free plan</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button className="p-1.5 text-zinc-600 hover:text-blue-400 transition-colors">
							<Download size={14} />
						</button>
						<ChevronRight size={14} className="text-zinc-700" />
					</div>
				</div>
			</div>
		</div>
	);
};
