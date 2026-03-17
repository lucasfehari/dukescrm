import React, { useState, useEffect } from "react";
import { Link as LinkIcon, ExternalLink, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LinkPreviewProps {
    url: string;
}

export function SmartLink({ url }: LinkPreviewProps) {
    const [domain, setDomain] = useState("");

    useEffect(() => {
        try {
            const d = new URL(url).hostname;
            setDomain(d);
        } catch {
            setDomain(url);
        }
    }, [url]);

    const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

    return (
        <motion.a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-2 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-800 transition-all group max-w-sm mt-2 no-underline"
        >
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-indigo-500/20">
                {domain ? (
                    <img
                        src={faviconUrl}
                        alt={domain}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-zinc-500"><Globe class="w-5 h-5" /></div>';
                        }}
                    />
                ) : (
                    <Globe className="w-5 h-5 text-zinc-500" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-400">
                    {domain}
                </p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {url}
                </p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 mr-1" />
        </motion.a>
    );
}

interface SmartEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
}

export function SmartEditor({ value, onChange, placeholder, className, label }: SmartEditorProps) {
    const [links, setLinks] = useState<string[]>([]);

    useEffect(() => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = value.match(urlRegex) || [];
        // Unique links
        setLinks(Array.from(new Set(matches)));
    }, [value]);

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium text-zinc-300">{label}</label>}
            <div className="relative group">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`
                        w-full min-h-[120px] p-4 rounded-xl
                        bg-zinc-800 border-white/10 text-zinc-200 text-sm
                        focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/30
                        placeholder:text-zinc-600 resize-none transition-all
                        ${className}
                    `}
                    style={{ height: 'auto', minHeight: '120px' }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1 px-2 rounded-md bg-zinc-900/80 border border-white/10 text-[10px] text-zinc-500 uppercase font-black">
                        Editor Inteligente
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {links.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 pt-2"
                    >
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
                            <LinkIcon className="w-3 h-3" /> Links detectados
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {links.map((link) => (
                                <SmartLink key={link} url={link} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
