// @mentions are stored in a message body as  @[Display Name](userId)  so they survive renames
// and can be matched exactly by id on the server. The composer shows them as plain "@Display Name".
// This module is pure (no React) so it can be checked on its own.

export interface Mentionable {
    id: number;
    name: string;
}

export type MentionPart =
    | { type: 'text'; text: string }
    | { type: 'mention'; name: string; id: number };

const TOKEN = /@\[([^\]]+)\]\((\d+)\)/g;

/** Brackets would break the token format, so they are dropped from names everywhere. */
export const safeName = (name: string): string => name.replace(/[[\]()]/g, '').trim();

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Split a stored body into plain text and mention chips for display. */
export function parseMentions(body: string): MentionPart[] {
    const parts: MentionPart[] = [];
    let last = 0;
    for (const m of body.matchAll(TOKEN)) {
        const start = m.index ?? 0;
        if (start > last) parts.push({ type: 'text', text: body.slice(last, start) });
        parts.push({ type: 'mention', name: m[1], id: Number(m[2]) });
        last = start + m[0].length;
    }
    if (last < body.length) parts.push({ type: 'text', text: body.slice(last) });
    return parts;
}

export const mentionedIds = (body: string): number[] =>
    parseMentions(body).flatMap((p) => (p.type === 'mention' ? [p.id] : []));

/** Stored body -> what the user sees and edits. */
export const bodyToDraft = (body: string): string => body.replace(TOKEN, (_, name) => `@${name}`);

/**
 * What the user typed -> stored body. Every "@Name" that matches a room member exactly (and is not
 * glued to a longer word) becomes a token. Longest names go first, so "@Ann Lee" is not read as "@Ann".
 */
export function draftToBody(draft: string, members: Mentionable[]): string {
    const byLength = [...members]
        .map((m) => ({ id: m.id, name: safeName(m.name) }))
        .filter((m) => m.name.length > 0)
        .sort((a, b) => b.name.length - a.name.length);

    let out = draft;
    for (const m of byLength) {
        // (^|non-word) keeps "email@Ann" from matching; (?!\w) keeps "@Annabel" from matching "@Ann".
        const re = new RegExp(`(^|[^\\w@\\[])@${escapeRegex(m.name)}(?!\\w)`, 'gi');
        out = out.replace(re, (_, lead) => `${lead}@[${m.name}](${m.id})`);
    }
    return out;
}

/** The "@xyz" being typed right before the caret, if any. */
export function activeMentionQuery(text: string, caret: number): { start: number; query: string } | null {
    const before = text.slice(0, caret);
    const match = /(^|\s)@([^\s@]*)$/.exec(before);
    if (!match) return null;
    return { start: before.length - match[2].length - 1, query: match[2] };
}

/** Replace the "@query" at `start` with the chosen name; returns the new text and caret. */
export function applyMention(text: string, caret: number, start: number, name: string) {
    const inserted = `@${safeName(name)} `;
    return { text: text.slice(0, start) + inserted + text.slice(caret), caret: start + inserted.length };
}

export const filterMembers = <T extends Mentionable>(members: T[], query: string, limit = 6): T[] => {
    const q = query.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q)).slice(0, limit);
};
