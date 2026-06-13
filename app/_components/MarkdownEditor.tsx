"use client";

import { useEffect, useRef } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import "@milkdown/crepe/theme/common/style.css";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
}

/**
 * A Markdown editor component using Milkdown Crepe.
 * Configured to show only Bold, Italic, and Link buttons in the top bar.
 */
export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const crepeRef = useRef<Crepe | null>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!containerRef.current) return;

        const crepe = new Crepe({
            root: containerRef.current,
            defaultValue: value,
            features: {
                [CrepeFeature.CodeMirror]: false,
                [CrepeFeature.ListItem]: false,
                [CrepeFeature.LinkTooltip]: true,
                [CrepeFeature.Cursor]: false,
                [CrepeFeature.ImageBlock]: false,
                [CrepeFeature.BlockEdit]: false,
                [CrepeFeature.Toolbar]: true,
                [CrepeFeature.Placeholder]: true,
                [CrepeFeature.Table]: false,
                [CrepeFeature.TopBar]: true,
                [CrepeFeature.Latex]: false,
            },
            featureConfigs: {
                [CrepeFeature.TopBar]: {
                    headingOptions: [{ label: 'Paragraph', level: null }],
                }
            }
        })

        crepe.editor
            .use(listener)
            .config((ctx) => {
                ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
                    onChangeRef.current(markdown);
                });
            });

        crepe.create().then(() => {
            crepeRef.current = crepe;
        });

        return () => {
            crepe.destroy();
        };
    }, []); // Initialize once per mount; parent uses 'key' to handle updates

    return (
        <div className="relative">
            <style dangerouslySetInnerHTML={{
                __html: `
                .milkdown-crepe-editor .ProseMirror ::selection {
                    background-color: #cae0ff !important;
                    color: inherit;
                }
            ` }} />
            <div ref={containerRef} className="milkdown-crepe-editor border rounded min-h-[300px]" />
        </div>
    );
}