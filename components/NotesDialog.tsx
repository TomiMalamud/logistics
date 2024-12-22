import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function NotesDialog({ 
    isOpen, 
    onClose, 
    notes, 
    newNote, 
    setNewNote, 
    isAddingNote, 
    onAddNote, 
    formatNoteDate 
  }) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto">
              <ul className="list-disc list-inside space-y-2">
                {notes.map((note, index) => (
                  <li
                    className="text-sm text-slate-600 leading-6 lowercase"
                    key={note.id || index}
                  >
                    {note.text} | {formatNoteDate(note.created_at || "")}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isAddingNote && newNote.trim()) {
                    onAddNote();
                  }
                }}
                placeholder="Añadir nueva nota"
                disabled={isAddingNote}
              />
              <Button
                variant="outline"
                onClick={onAddNote}
                disabled={isAddingNote || !newNote.trim()}
              >
                {isAddingNote ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  