import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { IconLoader2, IconTrash, IconDeviceFloppy } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useCardOperations } from '../../../contexts/card-operations-context';
import { Skeleton } from '@/components/ui/skeleton';

interface CardNoteEditorProps {
  cardId: number;
  initialNoteText: string;
  onSaveNote?: (noteText: string) => Promise<boolean>;
  onDeleteNote?: () => void;
  onNoteStatusChange?: (cardId: number, hasNote: boolean) => void;
  isProcessing: boolean | { notes?: Record<number, boolean> };
}

export const CardNoteEditor: React.FC<CardNoteEditorProps> = ({
  cardId,
  initialNoteText,
  onSaveNote,
  onDeleteNote,
  onNoteStatusChange,
  isProcessing
}) => {
  const [noteText, setNoteText] = useState(initialNoteText || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { addNote, updateNote, deleteNote } = useCardOperations();

  // Ref to track last saved text
  const lastSavedTextRef = useRef(initialNoteText || '');

  // Update state when initialNoteText changes externally
  useEffect(() => {
    console.log('[NoteEditor] initialNoteText changed:', initialNoteText);
    setNoteText(initialNoteText || '');
    lastSavedTextRef.current = initialNoteText || '';
    setHasChanges(false);
  }, [initialNoteText]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setNoteText(newText);
    setHasChanges(newText !== lastSavedTextRef.current);
  };

  // Text field key press handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save only on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (hasChanges && !isSaving && !isDeleting && !isLoading) {
        handleSaveNote();
      }
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() && lastSavedTextRef.current.trim()) {
      // If text is empty but was not empty before, delete note without confirmation
      handleDeleteNote();
      return;
    }

    setIsSaving(true);
    try {
      if (onSaveNote) {
        const success = await onSaveNote(noteText);
        if (success) {
          lastSavedTextRef.current = noteText;
          setHasChanges(false);
        }
      } else {
        const hasExistingNote = lastSavedTextRef.current.trim() !== '';
        const method = hasExistingNote ? updateNote : addNote;

        const result = await method(cardId, noteText);
        if (result.success) {
          // Update note text from server response
          setNoteText(result.noteText);
          lastSavedTextRef.current = result.noteText;
          setHasChanges(false);

          if (onNoteStatusChange) {
            onNoteStatusChange(cardId, result.noteText.trim() !== '');
          }
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!lastSavedTextRef.current.trim()) return; // Nothing to delete

    setIsDeleting(true); // Set deletion flag before operation
    try {
      if (onDeleteNote) {
        await onDeleteNote();
      } else {
        const success = await deleteNote(cardId);
        if (success) {
          setNoteText('');
          lastSavedTextRef.current = '';
          setHasChanges(false);

          if (onNoteStatusChange) {
            onNoteStatusChange(cardId, false);
          }
        }
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Determine if loading indicator should be shown
  const isLoading =
    typeof isProcessing === 'boolean'
      ? isProcessing
      : isProcessing?.notes?.[cardId] || false;

  return (
    <div className='space-y-4'>
      <div className='flex flex-col space-y-3'>
        <div className='relative'>
          <Textarea
            placeholder='Add a note to this card...'
            value={noteText}
            onChange={handleNoteChange}
            onKeyDown={handleKeyDown}
            className='min-h-[180px] resize-none focus-visible:ring-0 focus-visible:border-zinc-300 dark:focus-visible:border-zinc-500 !shadow-none hover:shadow-none'
            disabled={isLoading || isSaving || isDeleting}
          />

          {(isLoading || isSaving || isDeleting) && (
            <div className='bg-white dark:bg-zinc-900 absolute inset-0 flex flex-col overflow-hidden p-3'>
              <Skeleton className='mb-2 h-4 w-3/4' />
              <Skeleton className='mb-2 h-4 w-full' />
              <Skeleton className='mb-2 h-4 w-5/6' />
              <Skeleton className='h-4 w-2/3' />
            </div>
          )}
        </div>

        <div className='flex items-center justify-between'>
          <div className='text-muted-foreground text-xs'>
            {isSaving ? (
              'Saving...'
            ) : isDeleting ? (
              'Deleting...'
            ) : hasChanges ? (
              <>Press "Save" or use Ctrl+Enter</>
            ) : (
              lastSavedTextRef.current.trim() && 'Note saved'
            )}
          </div>
          <div className='ml-auto flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleDeleteNote}
              disabled={
                isLoading ||
                isSaving ||
                isDeleting ||
                !lastSavedTextRef.current.trim()
              }
              className='text-destructive hover:text-destructive hover:bg-destructive/10 pr-1.5'
            >
              {isDeleting ? (
                <IconLoader2 className='h-3.5 w-3.5 animate-spin' />
              ) : (
                <IconTrash className=' h-3.5 w-3.5' />
              )}
              Delete
            </Button>

            <Button
              variant={hasChanges ? 'default' : 'ghost'}
              size='sm'
              onClick={handleSaveNote}
              disabled={isLoading || isSaving || isDeleting || !hasChanges}
              className='pr-1.5'
            >
              {isSaving ? (
                <IconLoader2 className=' h-3.5 w-3.5 animate-spin' />
              ) : (
                <IconDeviceFloppy className=' h-3.5 w-3.5' />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
