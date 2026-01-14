'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
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
import { IconKey, IconPlus, IconTrash, IconCopy, IconCheck, IconAlertTriangle, IconExternalLink, IconCode, IconApi, IconBook, IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';

interface Token {
  id: number;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

interface AccessInfo {
  type: 'paid' | 'free';
  is_paid: boolean;
  limit: number;
  current_count: number;
  remaining: number;
  is_group_access: boolean;
  group: {
    id: number;
    name: string;
    slug: string;
  } | null;
  note: string;
}

interface TokensResponse {
  tokens: Token[];
  tokens_count: number;
  tokens_available: number;
  max_tokens: number;
}

interface CreateTokenResponse {
  id: number;
  name: string;
  token: string;
  token_prefix: string;
  created_at: string;
  is_active: boolean;
  warning: string;
}

export function ClientTokensTab() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [tokensCount, setTokensCount] = useState(0);
  const [tokensAvailable, setTokensAvailable] = useState(5);
  const [maxTokens] = useState(5);
  
  // Create token dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<CreateTokenResponse | null>(null);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  
  // Delete token dialog
  const [tokenToDelete, setTokenToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load tokens
  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    if (!fetchWithAuth) {
      console.error('fetchWithAuth is not available');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/auth/client-tokens/');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTokens(result.data.tokens || []);
          setTokensCount(result.data.tokens_count || 0);
          setTokensAvailable(result.data.tokens_available || 0);
          setAccessInfo(result.access || null);
        }
      } else {
        const errorText = await response.text();
        console.error('Error loading tokens:', errorText);
        toast.error('Не удалось загрузить токены');
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      toast.error('Не удалось загрузить токены');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
        toast.error('Название токена обязательно');
      return;
    }

    if (!fetchWithAuth) {
      toast.error('Аутентификация недоступна');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetchWithAuth('/api/auth/client-tokens/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTokenName.trim() }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const newToken = result.data;
          // Optimistically update tokens list first
          const tokenForList = {
            id: newToken.id,
            name: newToken.name,
            token_prefix: newToken.token_prefix,
            created_at: newToken.created_at,
            last_used_at: null,
            is_active: newToken.is_active,
          };
          const newTokensAvailable = Math.max(0, tokensAvailable - 1);
          setTokens([...tokens, tokenForList]);
          setTokensCount(tokensCount + 1);
          setTokensAvailable(newTokensAvailable);
          // Close create dialog before showing warning
          setIsCreateDialogOpen(false);
          // Small delay to ensure dialog is closed before opening warning
          setTimeout(() => {
            setCreatedToken(newToken);
            setShowTokenWarning(true);
            setNewTokenName('');
          }, 100);
        }
      } else {
        const errorData = await response.json();
        let errorMessage = 'Не удалось создать токен';
        
        // Extract error message from various possible formats
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.__all__ && Array.isArray(errorData.__all__) && errorData.__all__.length > 0) {
          errorMessage = errorData.__all__[0];
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating token:', error);
      toast.error('Произошла ошибка при создании токена');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteToken = async () => {
    if (!tokenToDelete || !fetchWithAuth) {
      return;
    }

    // Optimistic update: save current state for rollback
    const previousTokens = [...tokens];
    const previousCount = tokensCount;
    const previousAvailable = tokensAvailable;

    // Optimistically remove token from UI
    const updatedTokens = tokens.filter((token) => token.id !== tokenToDelete);
    setTokens(updatedTokens);
    setTokensCount(Math.max(0, tokensCount - 1));
    setTokensAvailable(Math.min(maxTokens, tokensAvailable + 1));
    setTokenToDelete(null);

    setIsDeleting(true);
    try {
      const response = await fetchWithAuth(
        `/api/auth/client-tokens/${tokenToDelete}/delete/`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Токен успешно удален');
        // UI already updated optimistically, no need to refetch
      } else {
        // Rollback on error
        setTokens(previousTokens);
        setTokensCount(previousCount);
        setTokensAvailable(previousAvailable);
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Не удалось удалить токен';
        toast.error(errorMessage);
      }
    } catch (error) {
      // Rollback on error
      setTokens(previousTokens);
      setTokensCount(previousCount);
      setTokensAvailable(previousAvailable);
      console.error('Error deleting token:', error);
      toast.error('Произошла ошибка при удалении токена');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Скопировано в буфер обмена');
    } catch (error) {
      toast.error('Не удалось скопировать в буфер обмена');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Никогда';
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const translateNote = (note: string) => {
    const translations: Record<string, string> = {
      'Request limit is shared across all group members.': 'Лимит запросов распределяется между всеми участниками группы.',
      'Request limit is shared across all group members': 'Лимит запросов распределяется между всеми участниками группы'
    };
    return translations[note] || note;
  };

  if (loading) {
    return (
      <div>
        <h1 className='mb-6 text-xl font-bold'>API Токены</h1>
        <Separator className='mb-6' />
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='animate-pulse rounded-lg border p-4'>
              <div className='h-4 bg-muted rounded w-1/4 mb-2'></div>
              <div className='h-3 bg-muted rounded w-1/2'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-xl font-bold'>API Токены</h1>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => fetchTokens()}
          disabled={loading}
          className='h-8 w-8'
        >
          <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <hr className='mb-6 h-[0.5px] border-border' />

      {/* API Documentation Card */}
      <section className='relative z-20 mx-auto w-full rounded-lg border mb-6 overflow-hidden shadow-none bg-card'>
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-50'></div>
        <div className='absolute inset-0 bg-gradient-to-br from-transparent via-primary/3 to-transparent'></div>
        <div className='relative flex flex-col md:flex-row items-center'>
          <div className='p-6 flex-1 flex flex-col justify-center'>
            <h2 className='text-left text-xl font-medium tracking-tight text-foreground md:text-xl mb-6'>
              Изучите{' '}
              <span className='ml-1 font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
                Client API
              </span>
              {' '}документацию
            </h2>
            <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-4'>
              <a
                href='#'
                target='_blank'
                rel='noopener noreferrer'
                className='bg-primary text-primary-foreground no-underline flex space-x-2 group cursor-pointer relative transition duration-200 shadow-lg hover:shadow-xl font-semibold px-4 py-2 h-12 w-full items-center justify-center rounded-lg text-center text-sm hover:shadow-md sm:w-auto'
              >
                <span className='flex items-center gap-2'>
                  Просмотреть документацию
                  <IconExternalLink className='h-4 w-4' />
                </span>
              </a>
            </div>
          </div>
          <div className='md:flex-shrink-0 md:self-end'>
            <img
              alt='Документация клиентского API'
              className='block h-auto w-auto max-h-48 object-contain'
              src='/doc.png'
            />
          </div>
        </div>
      </section>

      {/* Access Info Card */}
      {accessInfo && (
        <Card className='mb-6 shadow-none'>
          <CardHeader>
            <CardTitle className='text-lg'>Лимиты доступа к API</CardTitle>
            <CardDescription>
              {translateNote(accessInfo.note)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
              <div>
                <div className='text-sm text-muted-foreground mb-1'>Тип доступа</div>
                <div className='flex items-center gap-2'>
                  <Badge variant={accessInfo.is_paid ? 'default' : 'secondary'}>
                    {accessInfo.type === 'paid' ? 'Платный' : 'Бесплатный'}
                  </Badge>
                  {accessInfo.is_group_access && accessInfo.group && (
                    <span className='text-sm text-muted-foreground'>
                      ({accessInfo.group.name})
                    </span>
                  )}
                </div>
              </div>
              {accessInfo.is_paid ? (
                <div>
                  <div className='text-sm text-muted-foreground mb-1'>Дневной лимит</div>
                  <div className='text-lg font-semibold'>{accessInfo.current_count} / {accessInfo.limit}</div>
                </div>
              ) : (
                <div>
                  <div className='text-sm text-muted-foreground mb-1'>Общий лимит</div>
                  <div className='text-lg font-semibold'>{accessInfo.current_count} / {accessInfo.limit}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tokens List */}
      <Card className='mb-6 shadow-none'>
        <CardHeader>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-lg'>Ваши токены</CardTitle>
                <CardDescription>
                  Создано {tokensCount} из {maxTokens} токенов
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                disabled={tokensAvailable === 0}
                className='flex items-center gap-2'
              >
                <IconPlus className='h-4 w-4' />
                Создать токен
              </Button>
            </div>
            
          </div>
        </CardHeader>
        <CardContent >
          <hr className='mb-6 h-[0.5px] border-border' />

          {tokens.length === 0 ? (
            <div className='py-12 text-center'>
              <IconKey className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              <h3 className='text-lg font-medium mb-2'>Токены еще не созданы</h3>
              <p className='text-sm text-muted-foreground'>
                Создайте ваш первый Client API токен, чтобы начать использовать API
              </p>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/50 hover:bg-muted/50'>
                    <TableHead className='pl-4'>Название</TableHead>
                    <TableHead>Ключ</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Последнее использование</TableHead>
                    <TableHead className='w-[10%]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className='pl-4'>
                        <span className='font-medium'>{token.name}</span>
                      </TableCell>
                      <TableCell>
                        <code className='text-xs font-mono tracking-wider'>
                          {token.token_prefix}...
                        </code>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {formatDate(token.created_at)}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {formatDate(token.last_used_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setTokenToDelete(token.id)}
                          className='h-8 w-8 p-0'
                        >
                          <IconTrash className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Token Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый токен</DialogTitle>
            <DialogDescription>
              Создайте новый Client API токен. Дайте ему описательное имя для идентификации его назначения.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium mb-2 block'>Название токена</label>
              <Input
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder='например, Production API, Development'
                maxLength={100}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTokenName.trim()) {
                    handleCreateToken();
                  }
                }}
              />
              <p className='text-xs text-muted-foreground mt-1'>
                Максимум 100 символов
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewTokenName('');
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateToken}
              disabled={!newTokenName.trim() || isCreating || tokensAvailable === 0}
            >
              {isCreating ? 'Создание...' : 'Создать токен'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Created Token Dialog */}
      <Dialog open={showTokenWarning} onOpenChange={setShowTokenWarning}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <IconAlertTriangle className='h-5 w-5 text-foreground' />
              Важно: Сохраните ваш токен
            </DialogTitle>
            <DialogDescription>
              {createdToken?.warning || 'Сохраните этот токен сейчас. Вы больше не сможете его увидеть.'}
            </DialogDescription>
          </DialogHeader>
          {createdToken && (
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium mb-2 block'>Название токена</label>
                <div className='p-3 bg-muted rounded-md'>{createdToken.name}</div>
              </div>
              <div>
                <label className='text-sm font-medium mb-2 block'>Полный токен</label>
                <div className='relative'>
                  <code className='block p-3 pr-24 bg-muted rounded-md text-xs font-mono break-all whitespace-pre-wrap overflow-wrap-anywhere'>
                    {createdToken.token}
                  </code>
                  <Button
                    variant='outline'
                    size='sm'
                    className='absolute top-2 right-2'
                    onClick={() => copyToClipboard(createdToken.token)}
                  >
                    <IconCopy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <div className='p-4 bg-muted border border-border rounded-md'>
                <p className='text-sm text-foreground flex items-start gap-2'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-foreground shrink-0 mt-0.5">
                    <path d="M12 9v4"></path>
                    <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z"></path>
                    <path d="M12 16h.01"></path>
                  </svg>
                  <span>Это единственный раз, когда вы увидите полный токен. Обязательно скопируйте и сохраните его в безопасном месте.</span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              setShowTokenWarning(false);
              setCreatedToken(null);
            }}>
              Я сохранил токен
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Token Confirmation */}
      <AlertDialog open={!!tokenToDelete} onOpenChange={(open) => !open && setTokenToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить токен</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот токен?{' '}
              <br />
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteToken}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

