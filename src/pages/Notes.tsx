import { useState } from 'react';
import { Plus, Trash2, FileText, CheckSquare, Bell, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useDashboard, Note } from '@/contexts/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const typeIcons = {
  note: FileText,
  todo: CheckSquare,
  reminder: Bell,
};

const typeLabels = {
  note: 'Notes',
  todo: 'To-Do',
  reminder: 'Reminders',
};

export default function Notes() {
  const { notes, setNotes } = useDashboard();
  const [activeTab, setActiveTab] = useState<'note' | 'todo' | 'reminder'>('todo');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteDate, setNewNoteDate] = useState('');

  const filteredNotes = notes.filter((n) => n.type === activeTab);

  const addNote = () => {
    if (!newNoteContent.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      content: newNoteContent,
      type: activeTab,
      completed: false,
      date: newNoteDate || '',
    };
    setNotes([newNote, ...notes]);
    setNewNoteContent('');
    setNewNoteDate('');
  };

  const updateNote = (id: string, field: keyof Note, value: string | boolean) => {
    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, [field]: value } : n
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const toggleComplete = (id: string) => {
    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, completed: !n.completed } : n
      )
    );
  };

  const Icon = typeIcons[activeTab];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Notes & Tracking</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Internal notes, to-dos, and reminders
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="todo" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            To-Do
          </TabsTrigger>
          <TabsTrigger value="reminder" className="gap-2">
            <Bell className="h-4 w-4" />
            Reminders
          </TabsTrigger>
          <TabsTrigger value="note" className="gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {/* Add New Item */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Add {activeTab === 'note' ? 'Note' : activeTab === 'todo' ? 'Task' : 'Reminder'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeTab === 'note' ? (
                  <Textarea
                    placeholder="Write your note here..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : (
                  <Input
                    placeholder={activeTab === 'todo' ? 'What needs to be done?' : 'Set a reminder...'}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  />
                )}
                {(activeTab === 'todo' || activeTab === 'reminder') && (
                  <div className="flex items-center gap-3">
                    <Input
                      type="date"
                      value={newNoteDate}
                      onChange={(e) => setNewNoteDate(e.target.value)}
                      className="w-auto"
                    />
                    <span className="text-sm text-muted-foreground">Due date (optional)</span>
                  </div>
                )}
                <Button onClick={addNote} disabled={!newNoteContent.trim()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add {activeTab === 'note' ? 'Note' : activeTab === 'todo' ? 'Task' : 'Reminder'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">{typeLabels[activeTab]} List</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredNotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No {typeLabels[activeTab].toLowerCase()} yet. Add one above!
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                        note.completed ? 'bg-muted/50 border-border/50' : 'bg-card border-border hover:bg-muted/30'
                      )}
                    >
                      {(activeTab === 'todo' || activeTab === 'reminder') && (
                        <button
                          onClick={() => toggleComplete(note.id)}
                          className={cn(
                            'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
                            note.completed
                              ? 'bg-success border-success text-success-foreground'
                              : 'border-border hover:border-primary'
                          )}
                        >
                          {note.completed && <Check className="h-3 w-3" />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        {activeTab === 'note' ? (
                          <Textarea
                            value={note.content}
                            onChange={(e) => updateNote(note.id, 'content', e.target.value)}
                            className={cn(
                              'min-h-[60px] border-0 bg-transparent p-0 focus-visible:ring-0 resize-none',
                              note.completed && 'line-through text-muted-foreground'
                            )}
                          />
                        ) : (
                          <Input
                            value={note.content}
                            onChange={(e) => updateNote(note.id, 'content', e.target.value)}
                            className={cn(
                              'border-0 bg-transparent p-0 h-auto focus-visible:ring-0',
                              note.completed && 'line-through text-muted-foreground'
                            )}
                          />
                        )}
                        {note.date && (
                          <p className={cn(
                            'text-xs mt-1',
                            note.completed ? 'text-muted-foreground/50' : 'text-muted-foreground'
                          )}>
                            Due: {format(new Date(note.date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
