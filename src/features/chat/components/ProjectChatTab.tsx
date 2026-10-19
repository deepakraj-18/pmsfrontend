import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { Pencil, Send, Trash2, X, Check, Paperclip, FileText, Download } from 'lucide-react';
import { useChatMembers, useProjectChat } from '../hooks/useChat';
import {
  activeMentionQuery, applyMention, bodyToDraft, draftToBody, filterMembers, mentionedIds, parseMentions,
} from '../mentions';
import { CHAT } from '@/constants/constants';
import { useToast } from '@/providers/ToastContext';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { chatService } from '@/api/services/chat.service';
import type { ChatAttachment, ChatMessage } from '@/api/services/chat.service';

interface Props {
  projectId: number;
  currentUserId?: number;
  canPost: boolean;
  /** Admins may remove other people's messages. */
  canModerate: boolean;
}

const STATUS_TEXT = {
  connecting: 'Connecting…',
  live: 'Live',
  reconnecting: 'Reconnecting…',
  offline: 'Offline — messages still send, but updates need a refresh',
  revoked: 'Access removed',
} as const;

const STATUS_DOT = {
  connecting: 'bg-amber-400',
  live: 'bg-emerald-500',
  reconnecting: 'bg-amber-400',
  offline: 'bg-rose-500',
  revoked: 'bg-rose-500',
} as const;

const extensionOf = (name: string) => {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
};
const isInlineImage = (name: string) => (CHAT.INLINE_IMAGE_EXTENSIONS as readonly string[]).includes(extensionOf(name));
const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/** One attached file: pictures preview inline, everything else is a download chip. */
function AttachmentView({ projectId, file, mine }: { projectId: number; file: ChatAttachment; mine: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const image = isInlineImage(file.file_name);

  useEffect(() => {
    if (!image) return;
    let url: string | null = null;
    let alive = true;
    chatService.downloadAttachment(projectId, file.id)
      .then((blob) => { if (alive) { url = URL.createObjectURL(blob); setPreview(url); } })
      .catch(() => undefined);
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [projectId, file.id, image]);

  const download = async () => {
    setBusy(true);
    try {
      saveBlob(await chatService.downloadAttachment(projectId, file.id), file.file_name);
    } catch {
      showToast('error', 'Download failed', 'You may no longer have access to this file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-1.5">
      {image && preview && (
        <button type="button" onClick={download} aria-label={`Download ${file.file_name}`} className="block">
          <img src={preview} alt={file.file_name} className="max-h-48 max-w-full rounded-lg border border-black/10" />
        </button>
      )}
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className={`mt-1 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-60
          ${mine ? 'bg-teal-700 text-white hover:bg-teal-800' : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50'}`}
      >
        <FileText size={14} />
        <span className="max-w-[200px] truncate">{file.file_name}</span>
        <span className="opacity-60">{formatSize(file.size)}</span>
        <Download size={13} />
      </button>
    </div>
  );
}

const errorText = (err: any, fallback: string) =>
  err?.response?.status === 429
    ? 'You are sending messages too quickly. Please wait a moment.'
    : err?.response?.data?.message || fallback;

export function ProjectChatTab({ projectId, currentUserId, canPost, canModerate }: Props) {
  const { showToast } = useToast();
  const { messages, status, loading, loadError, hasMore, loadOlder, send, edit, remove } =
    useProjectChat(projectId);

  const { data: members = [] } = useChatMembers(projectId);
  const [draft, setDraft] = useState('');
  const [caret, setCaret] = useState(0);
  const [pick, setPick] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(true);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastIdRef = useRef(0);

  // Keep the view pinned to the newest message unless the reader scrolled up to read history.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const newest = messages[messages.length - 1];
    if (!el || !newest) return;
    const isNew = newest.id !== lastIdRef.current;
    lastIdRef.current = newest.id;
    if (isNew && (stickToBottom.current || newest.sender_id === currentUserId)) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, currentUserId]);

  useEffect(() => { stickToBottom.current = true; }, [projectId]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const submit = async () => {
    const body = draftToBody(draft.trim(), members);
    if ((!body && files.length === 0) || sending || !canPost) return;
    setSending(true);
    try {
      await send(body, files);
      setDraft('');
      setFiles([]);
      stickToBottom.current = true;
    } catch (err: any) {
      showToast('error', 'Message not sent', errorText(err, 'Please try again.'));
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async (m: ChatMessage) => {
    const body = draftToBody(editDraft.trim(), members);
    if ((!body && m.attachments.length === 0) || body === m.body) { setEditingId(null); return; }
    try {
      await edit(m.id, body);
      setEditingId(null);
    } catch (err: any) {
      showToast('error', 'Could not edit message', errorText(err, 'Please try again.'));
    }
  };

  const del = async (m: ChatMessage) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      await remove(m.id);
    } catch (err: any) {
      showToast('error', 'Could not delete message', errorText(err, 'Please try again.'));
    }
  };

  // "@" autocomplete: the name being typed before the caret, matched against the room's members.
  const mentionState = canPost && pickerOpen ? activeMentionQuery(draft, caret) : null;
  const suggestions = mentionState ? filterMembers(members, mentionState.query) : [];
  const showPicker = suggestions.length > 0;

  const choose = (name: string) => {
    if (!mentionState) return;
    const next = applyMention(draft, caret, mentionState.start, name);
    setDraft(next.text);
    setCaret(next.caret);
    setPick(0);
    requestAnimationFrame(() => {
      draftRef.current?.focus();
      draftRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const onDraftKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPicker) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setPick((p) => (p + 1) % suggestions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setPick((p) => (p - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); choose(suggestions[pick].name); return; }
      if (e.key === 'Escape') { e.preventDefault(); setPickerOpen(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  // Checked here for instant feedback; the server checks again (type, size, count, real file signature).
  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files];
    for (const f of Array.from(picked)) {
      if (next.length >= CHAT.MAX_FILES) {
        showToast('warning', 'Too many files', `You can attach up to ${CHAT.MAX_FILES} files per message.`);
        break;
      }
      if (!(CHAT.ALLOWED_EXTENSIONS as readonly string[]).includes(extensionOf(f.name))) {
        showToast('warning', 'File type not allowed', `"${f.name}" cannot be attached.`);
        continue;
      }
      if (f.size === 0 || f.size > CHAT.MAX_FILE_BYTES) {
        showToast('warning', 'File too large', `"${f.name}" must be between 1 byte and ${CHAT.MAX_FILE_BYTES / 1024 / 1024} MB.`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (status === 'revoked') {
    return (
      <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        You no longer have access to this project's chat. If this is a mistake, ask a project admin to add you back.
      </div>
    );
  }

  if (loading) return <SectionLoadingIndicator label="Loading chat" />;
  if (loadError) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{loadError}</div>;
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-[640px] max-h-[75vh]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-200">Project chat</span>
        <span className="flex items-center gap-2 text-slate-500" role="status" aria-live="polite">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          {STATUS_TEXT[status]}
        </span>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {hasMore && (
          <div className="text-center pb-2">
            <button type="button" onClick={loadOlder}
              className="text-xs font-semibold text-teal-600 hover:underline">
              Load earlier messages
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">
            No messages yet. Say hello to the team.
          </div>
        )}

        {messages.map((m, i) => {
          const mine = m.sender_id === currentUserId;
          const prev = messages[i - 1];
          const created = new Date(m.created_at);
          const newDay = !prev || !isSameDay(new Date(prev.created_at), created);
          const grouped = !newDay && prev?.sender_id === m.sender_id
            && created.getTime() - new Date(prev.created_at).getTime() < 5 * 60_000;
          const canEdit = mine && canPost;
          const canDelete = (mine && canPost) || canModerate;

          return (
            <React.Fragment key={m.id}>
              {newDay && (
                <div className="text-center text-[11px] font-semibold text-slate-400 py-2">
                  {format(created, 'EEEE, MMM d')}
                </div>
              )}
              <div className={`group flex ${mine ? 'justify-end' : 'justify-start'} ${grouped ? '' : 'pt-2'}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm
                  ${mine ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'}
                  ${!mine && mentionedIds(m.body).includes(currentUserId ?? -1) ? 'ring-2 ring-amber-400' : ''}`}>
                  {!grouped && (
                    <div className={`text-[11px] font-semibold mb-0.5 ${mine ? 'text-teal-100' : 'text-slate-500'}`}>
                      {mine ? 'You' : m.sender_name}
                      {m.sender_is_external && !mine && (
                        <span className="ml-1.5 rounded bg-amber-100 text-amber-700 px-1 py-px text-[10px]">External</span>
                      )}
                      <span className="ml-2 font-normal opacity-70">{format(created, 'p')}</span>
                    </div>
                  )}

                  {editingId === m.id ? (
                    <div className="flex items-end gap-1.5">
                      <textarea
                        autoFocus
                        value={editDraft}
                        maxLength={CHAT.MAX_LENGTH}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(m); }
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        rows={2}
                        className="w-64 max-w-full rounded-md border border-white/40 bg-white/90 p-1.5 text-slate-800 text-sm"
                        aria-label="Edit message"
                      />
                      <button type="button" aria-label="Save edit" onClick={() => saveEdit(m)}><Check size={15} /></button>
                      <button type="button" aria-label="Cancel edit" onClick={() => setEditingId(null)}><X size={15} /></button>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">
                      {parseMentions(m.body).map((part, k) =>
                        part.type === 'text' ? (
                          <React.Fragment key={k}>{part.text}</React.Fragment>
                        ) : (
                          <span
                            key={k}
                            className={`rounded px-1 font-semibold ${
                              part.id === currentUserId
                                ? 'bg-amber-300 text-amber-950'
                                : mine ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            @{part.name}
                          </span>
                        ),
                      )}
                      {m.edited_at && <span className="ml-1.5 text-[10px] opacity-60">(edited)</span>}
                    </div>
                  )}
                  {m.attachments.map((a) => (
                    <AttachmentView key={a.id} projectId={projectId} file={a} mine={mine} />
                  ))}
                </div>

                {editingId !== m.id && (canEdit || canDelete) && (
                  <div className="self-center ml-1.5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity text-slate-400">
                    {canEdit && (
                      <button type="button" aria-label="Edit message" className="hover:text-slate-700"
                        onClick={() => { setEditingId(m.id); setEditDraft(bodyToDraft(m.body)); }}>
                        <Pencil size={13} />
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" aria-label="Delete message" className="hover:text-rose-600"
                        onClick={() => del(m)}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 p-3">
        {canPost ? (
          <div className="relative flex flex-col gap-2">
            {files.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Files to send">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs">
                    <FileText size={12} />
                    <span className="max-w-[160px] truncate">{f.name}</span>
                    <span className="opacity-60">{formatSize(f.size)}</span>
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, k) => k !== i))}>
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="relative flex items-end gap-2">
            {showPicker && (
              <ul
                role="listbox"
                aria-label="Mention someone"
                className="absolute bottom-full left-0 mb-1 w-64 max-w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-20"
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={i === pick}
                    onMouseDown={(e) => { e.preventDefault(); choose(s.name); }}
                    onMouseEnter={() => setPick(i)}
                    className={`flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer
                      ${i === pick ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200' : ''}`}
                  >
                    <span className="truncate">{s.name}</span>
                    {s.is_external && <span className="ml-2 text-[10px] text-amber-600">External</span>}
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept={CHAT.ALLOWED_EXTENSIONS.join(',')}
              onChange={(e) => addFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach files"
              title={`Attach up to ${CHAT.MAX_FILES} files (max ${CHAT.MAX_FILE_BYTES / 1024 / 1024} MB each)`}
              className="h-10 w-10 shrink-0 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Paperclip size={16} />
            </button>
            <textarea
              ref={draftRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setCaret(e.target.selectionStart);
                setPick(0);
                setPickerOpen(true);
              }}
              onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
              onKeyDown={onDraftKey}
              maxLength={CHAT.MAX_LENGTH}
              rows={2}
              placeholder="Write a message… Type @ to mention someone. Enter sends, Shift+Enter adds a line."
              aria-label="Message"
              className="flex-1 resize-none rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="button"
              onClick={submit}
              disabled={(!draft.trim() && files.length === 0) || sending}
              aria-label="Send message"
              className="h-10 w-10 shrink-0 rounded-lg bg-teal-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-teal-700"
            >
              <Send size={16} />
            </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">You can read this chat but your role does not allow posting.</p>
        )}
        {canPost && draft.length > CHAT.MAX_LENGTH * 0.9 && (
          <p className="mt-1 text-right text-[11px] text-slate-400">{draft.length} / {CHAT.MAX_LENGTH}</p>
        )}
      </div>
    </div>
  );
}
