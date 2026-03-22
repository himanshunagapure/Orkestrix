import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import {
  createOrUpdateCredential,
  credentialAuditParamsFromEnv,
  deleteProjectCredential,
  listProjectCredentials,
  type CredentialScope,
  type ProjectCredentialMeta,
} from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function formatUpdatedAt(c: ProjectCredentialMeta): string {
  const raw = c.updatedAt ?? c.updated_at;
  if (!raw) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(raw));
  } catch {
    return String(raw);
  }
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** API project id (`<id>-sb-<subscriber>`). */
  projectId: string;
};

const emptyForm = {
  name: '',
  type: '',
  service: '',
  scope: 'backend_only' as CredentialScope,
  value: '',
  environment: '',
};

export function ProjectCredentialsSheet({ open, onOpenChange, projectId }: Props) {
  const [rows, setRows] = useState<ProjectCredentialMeta[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [listEnvFilter, setListEnvFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectCredentialMeta | null>(null);

  const loadList = useCallback(async () => {
    if (!projectId) return;
    setListLoading(true);
    try {
      const env = listEnvFilter.trim() || undefined;
      const data = await listProjectCredentials(projectId, env);
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load credentials');
      setRows([]);
    } finally {
      setListLoading(false);
    }
  }, [projectId, listEnvFilter]);

  useEffect(() => {
    if (open && projectId) {
      void loadList();
    }
  }, [open, projectId, loadList]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingName(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    const name = form.name.trim();
    const type = form.type.trim();
    if (!name || !type) {
      toast.error('Name and type are required.');
      return;
    }
    if (!editingName && !form.value.trim()) {
      toast.error('Secret value is required when adding a credential.');
      return;
    }
    setSubmitting(true);
    try {
      const audit = credentialAuditParamsFromEnv();
      const envTrim = form.environment.trim();
      await createOrUpdateCredential(
        projectId,
        {
          name,
          type,
          service: form.service.trim(),
          scope: form.scope,
          ...(envTrim ? { environment: envTrim } : {}),
          ...(form.value.trim() ? { value: form.value } : {}),
        },
        audit
      );
      toast.success(editingName ? 'Credential updated.' : 'Credential saved.');
      resetForm();
      await loadList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (c: ProjectCredentialMeta) => {
    setEditingName(c.name);
    setForm({
      name: c.name,
      type: c.type,
      service: c.service ?? '',
      scope: (c.scope === 'frontend_public' ? 'frontend_public' : 'backend_only') as CredentialScope,
      value: '',
      environment: c.environment ?? '',
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !projectId) return;
    try {
      await deleteProjectCredential(projectId, pendingDelete.name, pendingDelete.environment || undefined);
      toast.success(`Removed “${pendingDelete.name}”.`);
      setPendingDelete(null);
      if (editingName === pendingDelete.name) resetForm();
      await loadList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-4 overflow-hidden sm:max-w-xl">
          <SheetHeader className="shrink-0 text-left">
            <SheetTitle>Project secrets</SheetTitle>
            <SheetDescription>
              Encrypted credentials for backend functions. Values are never shown after saving.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={onSubmit} className="shrink-0 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <div className="grid gap-2">
              <Label htmlFor="cred-name">Name</Label>
              <Input
                id="cred-name"
                autoComplete="off"
                placeholder="e.g. stripe_secret"
                value={form.name}
                disabled={!!editingName}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cred-type">Type</Label>
              <Input
                id="cred-type"
                autoComplete="off"
                placeholder="e.g. bearer_token, api_key"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cred-service">Service (optional)</Label>
              <Input
                id="cred-service"
                autoComplete="off"
                placeholder="e.g. Stripe"
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Scope</Label>
              <Select
                value={form.scope}
                onValueChange={(v) => setForm((f) => ({ ...f, scope: v as CredentialScope }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backend_only">backend_only</SelectItem>
                  <SelectItem value="frontend_public">frontend_public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cred-env">Environment (optional)</Label>
              <Input
                id="cred-env"
                autoComplete="off"
                placeholder="default or staging / prod"
                value={form.environment}
                onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cred-value">Secret value</Label>
              <Input
                id="cred-value"
                type="password"
                autoComplete="new-password"
                placeholder={editingName ? 'Leave empty to keep existing secret' : '••••••••'}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingName ? 'Update' : 'Add'}
              </Button>
              {editingName && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel edit
                </Button>
              )}
            </div>
          </form>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="grid flex-1 gap-1.5 min-w-[140px]">
                <Label htmlFor="list-env-filter" className="text-xs text-muted-foreground">
                  Filter list by environment
                </Label>
                <Input
                  id="list-env-filter"
                  placeholder="All environments"
                  value={listEnvFilter}
                  onChange={(e) => setListEnvFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void loadList();
                  }}
                />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => void loadList()} disabled={listLoading}>
                Refresh
              </Button>
            </div>

            <ScrollArea className="flex-1 rounded-md border border-border">
              <div className="p-2">
                {listLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : rows.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No credentials yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden sm:table-cell">Service</TableHead>
                        <TableHead className="hidden md:table-cell">Scope</TableHead>
                        <TableHead className="hidden lg:table-cell">Env</TableHead>
                        <TableHead className="hidden xl:table-cell">Updated</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((c) => (
                        <TableRow key={`${c.environment}:${c.name}`}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.type}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{c.service || '—'}</TableCell>
                          <TableCell className="hidden md:table-cell">{c.scope}</TableCell>
                          <TableCell className="hidden lg:table-cell">{c.environment || '—'}</TableCell>
                          <TableCell className="hidden xl:table-cell text-muted-foreground text-xs">
                            {formatUpdatedAt(c)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Edit ${c.name}`}
                                onClick={() => onEdit(c)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                aria-label={`Delete ${c.name}`}
                                onClick={() => setPendingDelete(c)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete credential?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `This removes “${pendingDelete.name}”${pendingDelete.environment ? ` (${pendingDelete.environment})` : ''}. Backend functions that rely on it may fail.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void confirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
