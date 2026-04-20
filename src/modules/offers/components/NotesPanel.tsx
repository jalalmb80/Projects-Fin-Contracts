import React, { useState } from 'react';
import { Send, Pin } from 'lucide-react';
import { OfferNote, NoteType, NOTE_TYPE_LABELS, NoteVisibility } from '../types';
import { usePlatform } from '../../../core/context/PlatformContext';

interface Props {
  notes: OfferNote[];
  onAddNote: (note: OfferNote) => Promise<void>;
}

export default function NotesPanel({ notes, onAddNote }: Props) {
  const { user } = usePlatform();
  const [body,       setBody]       = useState('');
  const [noteType,   setNoteType]   = useState<NoteType>('general');
  const [visibility, setVisibility] = useState<NoteVisibility>('internal');
  const [saving,     setSaving]     = useState(false);

  const sortedNotes = [...notes].sort(
    (a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0),
  );

  async function handleSubmit() {
    if (!body.trim() || !user) return;
    setSaving(true);
    try {
      const note: OfferNote = {
        id:                  crypto.randomUUID(),
        author_name:         user.displayName ?? user.email ?? '',
        author_email:        user.email ?? '',
        note_type:           noteType,
        visibility,
        body:                body.trim(),
        parent_note_id:      null,
        is_system_generated: false,
        is_pinned:           false,
        created_at:          new Date().toISOString(),
      };
      await onAddNote(note);
      setBody('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-500">Internal Notes</p>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedNotes.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-6">No notes yet</p>
        )}
        {sortedNotes.map(note => (
          <div
            key={note.id}
            className={`rounded-xl border p-3 text-xs ${
              note.is_pinned
                ? 'border-amber-200 bg-amber-50'
                : note.is_system_generated
                  ? 'border-slate-100 bg-slate-50 text-slate-500'
                  : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                {note.is_pinned && <Pin size={10} className="text-amber-500" />}
                <span className="font-medium text-slate-700">
                  {note.author_name || note.author_email}
                </span>
                <span className="text-slate-400">
                  {NOTE_TYPE_LABELS[note.note_type]?.en}
                </span>
              </div>
              <span className="text-slate-300">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{note.body}</p>
            {note.visibility === 'external' && (
              <span className="mt-1.5 inline-block px-1.5 py-0.5 text-xs rounded bg-blue-50 text-blue-600">External</span>
            )}
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        <div className="flex gap-2">
          <select
            value={noteType}
            onChange={e => setNoteType(e.target.value as NoteType)}
            className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-200"
          >
            {(Object.entries(NOTE_TYPE_LABELS) as [NoteType, { en: string }][]).map(([k, v]) => (
              <option key={k} value={k}>{v.en}</option>
            ))}
          </select>
          <select
            value={visibility}
            onChange={e => setVisibility(e.target.value as NoteVisibility)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-200"
          >
            <option value="internal">Internal</option>
            <option value="external">External</option>
          </select>
        </div>
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="flex-1 text-xs border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          />
          <button
            onClick={handleSubmit}
            disabled={!body.trim() || saving}
            className="self-end p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
            aria-label="Send note"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
