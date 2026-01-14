'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconBell, IconClock, IconMail, IconFilter, IconUsers, IconFolder, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { toast } from 'sonner';
import { config } from '@/config/config';

interface DigestSettings {
  is_enabled: boolean;
  digest_hour: number;
  timezone: string;
  additional_emails: string[];
  custom_filters_enabled: boolean;
  custom_investors_enabled: boolean;
  custom_folders_enabled: boolean;
}

interface SavedFilter {
  id: number;
  name: string;
  in_digest: boolean;
}

interface SavedParticipant {
  id: number;
  name: string;
  type: string;
  image: string | null;
  about: string;
  in_digest: boolean;
}

interface UserFolder {
  id: number;
  name: string;
  in_digest: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total_count: number;
  has_next: boolean;
  has_previous: boolean;
}

export function NotificationsTab() {
  const [settings, setSettings] = useState<DigestSettings>({
    is_enabled: false,
    digest_hour: 8,
    timezone: "America/New_York",
    additional_emails: [],
    custom_filters_enabled: false,
    custom_investors_enabled: false,
    custom_folders_enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Состояние для списков кастомных настроек
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [savedParticipants, setSavedParticipants] = useState<SavedParticipant[]>([]);
  const [userFolders, setUserFolders] = useState<UserFolder[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingMoreFilters, setLoadingMoreFilters] = useState(false);
  const [loadingMoreParticipants, setLoadingMoreParticipants] = useState(false);
  const [loadingMoreFolders, setLoadingMoreFolders] = useState(false);
  
  // Состояние пагинации
  const [filtersPagination, setFiltersPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total_count: 0,
    has_next: false,
    has_previous: false
  });
  const [participantsPagination, setParticipantsPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total_count: 0,
    has_next: false,
    has_previous: false
  });
  const [foldersPagination, setFoldersPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total_count: 0,
    has_next: false,
    has_previous: false
  });
  
  const [expandedSections, setExpandedSections] = useState<{
    filters: boolean;
    participants: boolean;
    folders: boolean;
  }>({
    filters: false,
    participants: false,
    folders: false
  });

  // Загрузка настроек при монтировании компонента
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/user/digest-settings');
        if (!response.ok) {
          throw new Error('Failed to fetch digest settings');
        }
        const data = await response.json();
        setSettings(data);
        
        // Если кастомные настройки включены, загружаем соответствующие данные
        if (data.custom_filters_enabled) {
          fetchSavedFilters();
        }
        if (data.custom_investors_enabled) {
          fetchSavedParticipants();
        }
        if (data.custom_folders_enabled) {
          fetchUserFolders();
        }
      } catch (error) {
        console.error('Error fetching digest settings:', error);
        toast.error('Не удалось загрузить настройки уведомлений');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Обновление конкретной настройки
  const updateSetting = (key: keyof DigestSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Добавление дополнительного email
  const addEmail = () => {
    if (newEmail && newEmail.includes('@') && !settings.additional_emails.includes(newEmail)) {
      updateSetting('additional_emails', [...settings.additional_emails, newEmail]);
      setNewEmail('');
    }
  };

  // Удаление дополнительного email
  const removeEmail = (emailToRemove: string) => {
    updateSetting('additional_emails', settings.additional_emails.filter(email => email !== emailToRemove));
  };

  // Загрузка сохраненных фильтров
  const fetchSavedFilters = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMoreFilters(true);
    } else {
      setLoadingFilters(true);
    }
    try {
      const response = await fetch(`/api/user/digest-settings/saved-filters?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setSavedFilters(prev => [...prev, ...(data.filters || [])]);
        } else {
          setSavedFilters(data.filters || []);
        }
        setFiltersPagination(data.pagination || {
          page: 1,
          limit: 20,
          total_count: 0,
          has_next: false,
          has_previous: false
        });
      }
    } catch (error) {
      console.error('Error fetching saved filters:', error);
    } finally {
      if (append) {
        setLoadingMoreFilters(false);
      } else {
        setLoadingFilters(false);
      }
    }
  };

  // Загрузка сохраненных участников
  const fetchSavedParticipants = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMoreParticipants(true);
    } else {
      setLoadingParticipants(true);
    }
    try {
      const response = await fetch(`/api/user/digest-settings/saved-participants?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setSavedParticipants(prev => [...prev, ...(data.participants || [])]);
        } else {
          setSavedParticipants(data.participants || []);
        }
        setParticipantsPagination(data.pagination || {
          page: 1,
          limit: 20,
          total_count: 0,
          has_next: false,
          has_previous: false
        });
      }
    } catch (error) {
      console.error('Error fetching saved participants:', error);
    } finally {
      if (append) {
        setLoadingMoreParticipants(false);
      } else {
        setLoadingParticipants(false);
      }
    }
  };

  // Загрузка папок пользователя
  const fetchUserFolders = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMoreFolders(true);
    } else {
      setLoadingFolders(true);
    }
    try {
      const response = await fetch(`/api/user/digest-settings/folders?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setUserFolders(prev => [...prev, ...(data.folders || [])]);
        } else {
          setUserFolders(data.folders || []);
        }
        setFoldersPagination(data.pagination || {
          page: 1,
          limit: 20,
          total_count: 0,
          has_next: false,
          has_previous: false
        });
      }
    } catch (error) {
      console.error('Error fetching user folders:', error);
    } finally {
      if (append) {
        setLoadingMoreFolders(false);
      } else {
        setLoadingFolders(false);
      }
    }
  };

  // Переключение состояния раздела
  const toggleSection = (section: 'filters' | 'participants' | 'folders') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    
    // Загружаем данные только при первом открытии и если список пустой
    if (!expandedSections[section]) {
      if (section === 'filters' && savedFilters.length === 0) {
        fetchSavedFilters();
      }
      if (section === 'participants' && savedParticipants.length === 0) {
        fetchSavedParticipants();
      }
      if (section === 'folders' && userFolders.length === 0) {
        fetchUserFolders();
      }
    }
  };

  // Загрузка дополнительных страниц
  const loadMoreFilters = () => {
    if (filtersPagination.has_next) {
      fetchSavedFilters(filtersPagination.page + 1, true);
    }
  };

  const loadMoreParticipants = () => {
    if (participantsPagination.has_next) {
      fetchSavedParticipants(participantsPagination.page + 1, true);
    }
  };

  const loadMoreFolders = () => {
    if (foldersPagination.has_next) {
      fetchUserFolders(foldersPagination.page + 1, true);
    }
  };

  // Обновление статуса элемента в дайджесте (только локально)
  const updateItemDigestStatus = (type: 'filter' | 'participant' | 'folder', id: number, inDigest: boolean) => {
    // Обновляем только локальное состояние
    if (type === 'filter') {
      setSavedFilters(prev => prev.map(f => f.id === id ? { ...f, in_digest: inDigest } : f));
    } else if (type === 'participant') {
      setSavedParticipants(prev => prev.map(p => p.id === id ? { ...p, in_digest: inDigest } : p));
    } else if (type === 'folder') {
      setUserFolders(prev => prev.map(f => f.id === id ? { ...f, in_digest: inDigest } : f));
    }
    
    // Помечаем, что есть несохраненные изменения
    setHasUnsavedChanges(true);
  };

  // Сохранение настроек
  const saveSettings = async () => {
    setSaving(true);
    try {
      // Подготавливаем данные для отправки
      const requestData: any = {
        is_enabled: settings.is_enabled,
        digest_hour: settings.digest_hour,
        timezone: settings.timezone,
        additional_emails: settings.additional_emails,
        custom_filters_enabled: settings.custom_filters_enabled,
        custom_investors_enabled: settings.custom_investors_enabled,
        custom_folders_enabled: settings.custom_folders_enabled,
      };

      // Добавляем кастомные настройки только если они включены
      if (settings.custom_filters_enabled && savedFilters.length > 0) {
        requestData.filters = savedFilters.map(filter => ({
          id: filter.id,
          in_digest: filter.in_digest
        }));
      }

      if (settings.custom_investors_enabled && savedParticipants.length > 0) {
        requestData.participants = savedParticipants.map(participant => ({
          id: participant.id,
          in_digest: participant.in_digest
        }));
      }

      if (settings.custom_folders_enabled && userFolders.length > 0) {
        requestData.folders = userFolders.map(folder => ({
          id: folder.id,
          in_digest: folder.in_digest
        }));
      }

      const response = await fetch('/api/user/digest-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to save digest settings');
      }

      setHasUnsavedChanges(false);
      toast.success('Настройки уведомлений успешно сохранены');
    } catch (error) {
      console.error('Error saving digest settings:', error);
      toast.error('Не удалось сохранить настройки уведомлений');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className='mb-6 text-xl font-bold'>Уведомления</h1>
        <Separator className='mb-6' />

        <div className="space-y-6">
          {/* Скелетон основной карточки */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-muted rounded"></div>
                  <div className="h-6 bg-muted rounded w-32"></div>
                </div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-48"></div>
                  </div>
                  <div className="h-6 w-11 bg-muted rounded-full"></div>
                </div>
              </div>
              
              <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Скелетон дополнительных карточек */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-muted rounded"></div>
                  <div className="h-6 bg-muted rounded w-40"></div>
                </div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-pulse">
                <div className="flex gap-2">
                  <div className="h-10 bg-muted rounded flex-1"></div>
                  <div className="h-10 bg-muted rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <div className="animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-muted rounded"></div>
                  <div className="h-6 bg-muted rounded w-28"></div>
                </div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-48"></div>
                    </div>
                    <div className="h-6 w-11 bg-muted rounded-full"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Скелетон кнопки сохранения */}
          <div className="flex justify-end">
            <div className="animate-pulse">
              <div className="h-10 bg-muted rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={hasUnsavedChanges ? 'pb-20' : ''}>
      <h1 className='mb-6 text-xl font-bold'>Уведомления</h1>
      <Separator className='mb-6' />

      {/* Digest Settings Section */}
      <div className="space-y-4">
       

        {/* Enable Digest Toggle */}
        <Card className="shadow-none">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="digest-enabled" className="text-base font-medium">Включить ежедневный дайджест</Label>
                <p className="text-sm text-muted-foreground/70">Получайте ежедневные email-уведомления с новыми карточками и обновлениями на основе ваших сохраненных фильтров, отслеживаемых участников и папок. Включите дайджест и настройте критерии ниже для персонализации или оставьте настройки по умолчанию.</p>
              </div>
              <Switch
                id="digest-enabled"
                checked={settings.is_enabled}
                onCheckedChange={(checked) => updateSetting('is_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {settings.is_enabled && (
          <div className="space-y-4">
          {/* Schedule */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconClock className="h-5 w-5" />
                <CardTitle>Расписание</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground/70">
                Когда получать дайджест
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="w-full">
                  <Label className="text-sm text-muted-foreground">Время</Label>
                  <Select
                    value={settings.digest_hour.toString()}
                    onValueChange={(value) => updateSetting('digest_hour', parseInt(value))}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full">
                  <Label className="text-sm text-muted-foreground">Часовой пояс</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSetting('timezone', value)}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                      <SelectItem value="Europe/London">London (UTC+0/+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (UTC+1/+2)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (UTC+1/+2)</SelectItem>
                      <SelectItem value="Europe/Moscow">Moscow (UTC+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (UTC+4)</SelectItem>
                      <SelectItem value="Asia/Kolkata">Mumbai (UTC+5:30)</SelectItem>
                      <SelectItem value="Asia/Shanghai">Shanghai (UTC+8)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (UTC+9)</SelectItem>
                      <SelectItem value="Pacific/Sydney">Sydney (UTC+10/+11)</SelectItem>
                      <SelectItem value="America/New_York">New York (UTC-5/-4)</SelectItem>
                      <SelectItem value="America/Chicago">Chicago (UTC-6/-5)</SelectItem>
                      <SelectItem value="America/Denver">Denver (UTC-7/-6)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (UTC-8/-7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Emails */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconMail className="h-5 w-5" />
                <CardTitle>Дополнительные email-адреса</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground/70">
                По умолчанию письма отправляются на email вашего аккаунта, вы можете добавить дополнительные адреса здесь
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder="Введите email-адрес"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                    className="h-10 pl-10"
                  />
                  <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button 
                  onClick={addEmail} 
                  disabled={!newEmail || !newEmail.includes('@')}
                  className="h-10 px-6"
                >
                  Добавить
                </Button>
              </div>
              {settings.additional_emails.length > 0 && (
                <div className="space-y-2 mt-4">
                  {settings.additional_emails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border">
                      <span className="text-sm">{email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmail(email)}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}
      </div>

      {/* Списки кастомных настроек - показываем всегда, но список только при включенном переключателе */}
      {settings.is_enabled && (
        <div className="space-y-4 mt-4">
          {/* Список фильтров */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconFilter className="h-5 w-5" />
                  <CardTitle>Сохраненные фильтры</CardTitle>
                  {settings.custom_filters_enabled && (
                    <span className="text-sm text-muted-foreground">
                      ({savedFilters.filter(f => f.in_digest).length} выбрано)
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <button
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      !settings.custom_filters_enabled 
                        ? 'bg-background text-foreground shadow-sm font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      updateSetting('custom_filters_enabled', false);
                    }}
                  >
                    Все
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      settings.custom_filters_enabled 
                        ? 'bg-background text-foreground shadow-sm font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      updateSetting('custom_filters_enabled', true);
                      // Загружаем данные только если список пустой
                      if (savedFilters.length === 0) {
                        fetchSavedFilters();
                      }
                    }}
                  >
                    Выборочно
                  </button>
                </div>
              </div>
              <CardDescription className="text-muted-foreground/70">
                {settings.custom_filters_enabled 
                  ? "Получайте уведомления о новых карточках, соответствующих вашим сохраненным фильтрам. Выберите 'Все' для отслеживания каждого фильтра или 'Выборочно' для выбора конкретных."
                  : "Получайте уведомления о новых карточках, соответствующих вашим сохраненным фильтрам. Выберите 'Все' для отслеживания каждого фильтра или 'Выборочно' для выбора конкретных."
                }
              </CardDescription>
            </CardHeader>
            {settings.custom_filters_enabled && (
              <CardContent>
                {loadingFilters ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : savedFilters.length > 0 ? (
                  <div className="space-y-2">
                    {savedFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${filter.id}`}
                          checked={filter.in_digest}
                          onCheckedChange={(checked) => 
                            updateItemDigestStatus('filter', filter.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`filter-${filter.id}`} className="text-sm">
                          {filter.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Сохраненные фильтры не найдены</p>
                  )}
                  
                  {/* Скелетон для дозагружаемых фильтров */}
                  {loadingMoreFilters && (
                    <div className="space-y-2 pt-2">
                      {[1, 2, 3].map((i) => (
                        <div key={`skeleton-${i}`} className="flex items-center space-x-2">
                          <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Кнопка загрузки дополнительных фильтров */}
                  {savedFilters.length > 0 && filtersPagination.has_next && (
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        onClick={loadMoreFilters}
                        disabled={loadingMoreFilters}
                        className="w-full"
                      >
                        {loadingMoreFilters ? 'Загрузка...' : 'Загрузить еще'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

          {/* Список участников */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconUsers className="h-5 w-5" />
                  <CardTitle>Отслеживаемые участники</CardTitle>
                  {settings.custom_investors_enabled && (
                    <span className="text-sm text-muted-foreground">
                      ({savedParticipants.filter(p => p.in_digest).length} selected)
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <button
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      !settings.custom_investors_enabled 
                        ? 'bg-background text-foreground shadow-sm font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      updateSetting('custom_investors_enabled', false);
                    }}
                  >
                    Все
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      settings.custom_investors_enabled 
                        ? 'bg-background text-foreground shadow-sm font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      updateSetting('custom_investors_enabled', true);
                      // Загружаем данные только если список пустой
                      if (savedParticipants.length === 0) {
                        fetchSavedParticipants();
                      }
                    }}
                  >
                    Выборочно
                  </button>
                </div>
              </div>
              <CardDescription className="text-muted-foreground/70">
                {settings.custom_investors_enabled 
                  ? "Получайте уведомления о новых карточках с участием ваших отслеживаемых инвесторов, основателей и других участников. Также получайте обновления об изменениях стадий или новых раундах финансирования их проектов."
                  : "Получайте уведомления о новых карточках с участием ваших отслеживаемых инвесторов, основателей и других участников. Также получайте обновления об изменениях стадий или новых раундах финансирования их проектов."
                }
              </CardDescription>
            </CardHeader>
            {settings.custom_investors_enabled && (
              <CardContent>
                {loadingParticipants ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                        <div className="space-y-1 flex-1">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                          <div className="h-3 bg-muted rounded w-32 animate-pulse"></div>
                        </div>
                        <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : savedParticipants.length > 0 ? (
                  <div className="space-y-3">
                    {savedParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={participant.image || ''} />
                          <AvatarFallback>
                            {participant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`participant-${participant.id}`}
                              checked={participant.in_digest}
                              onCheckedChange={(checked) => 
                                updateItemDigestStatus('participant', participant.id, checked as boolean)
                              }
                            />
                            <Label htmlFor={`participant-${participant.id}`} className="text-sm font-medium">
                              {participant.name}
                            </Label>
                            <span className="text-xs text-muted-foreground capitalize">
                              ({participant.type})
                            </span>
                          </div>
                          {participant.about && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {participant.about.length > 60 
                                ? `${participant.about.substring(0, 60)}...` 
                                : participant.about}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Отслеживаемые участники не найдены</p>
                  )}
                  
                  {/* Скелетон для дозагружаемых участников */}
                  {loadingMoreParticipants && (
                    <div className="space-y-3 pt-2">
                      {[1, 2, 3].map((i) => (
                        <div key={`skeleton-${i}`} className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                          <div className="space-y-1 flex-1">
                            <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                            <div className="h-3 bg-muted rounded w-32 animate-pulse"></div>
                          </div>
                          <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Кнопка загрузки дополнительных участников */}
                  {savedParticipants.length > 0 && participantsPagination.has_next && (
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        onClick={loadMoreParticipants}
                        disabled={loadingMoreParticipants}
                        className="w-full"
                      >
                        {loadingMoreParticipants ? 'Loading...' : 'Load More'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

          {/* Список папок */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconFolder className="h-5 w-5" />
                  <CardTitle>Мои папки</CardTitle>
                  {settings.custom_folders_enabled && (
                    <span className="text-sm text-muted-foreground">
                      ({userFolders.filter(f => f.in_digest).length} selected)
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <button
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      !settings.custom_folders_enabled 
                        ? 'bg-background text-foreground shadow-sm font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      updateSetting('custom_folders_enabled', false);
                    }}
                  >
                    Все
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      settings.custom_folders_enabled 
                        ? 'bg-background text-foreground shadow-sm font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      updateSetting('custom_folders_enabled', true);
                      // Загружаем данные только если список пустой
                      if (userFolders.length === 0) {
                        fetchUserFolders();
                      }
                    }}
                  >
                    Выборочно
                  </button>
                </div>
              </div>
              <CardDescription className="text-muted-foreground/70">
                {settings.custom_folders_enabled 
                  ? "Получайте уведомления об обновлениях проектов из всех ваших папок или только из конкретных"
                  : "Получайте уведомления об обновлениях проектов из всех ваших папок или только из конкретных"
                }
              </CardDescription>
            </CardHeader>
            {settings.custom_folders_enabled && (
              <CardContent>
                {loadingFolders ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : userFolders.length > 0 ? (
                  <div className="space-y-2">
                    {userFolders.map((folder) => (
                      <div key={folder.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`folder-${folder.id}`}
                          checked={folder.in_digest}
                          onCheckedChange={(checked) => 
                            updateItemDigestStatus('folder', folder.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`folder-${folder.id}`} className="text-sm">
                          {folder.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Папки не найдены</p>
                  )}
                  
                  {/* Скелетон для дозагружаемых папок */}
                  {loadingMoreFolders && (
                    <div className="space-y-2 pt-2">
                      {[1, 2, 3].map((i) => (
                        <div key={`skeleton-${i}`} className="flex items-center space-x-2">
                          <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Кнопка загрузки дополнительных папок */}
                  {userFolders.length > 0 && foldersPagination.has_next && (
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        onClick={loadMoreFolders}
                        disabled={loadingMoreFolders}
                        className="w-full"
                      >
                        {loadingMoreFolders ? 'Loading...' : 'Load More'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
        </div>
      )}

      {/* Sticky кнопка сохранения */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 z-40 max-w-xs">
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                Несохраненные изменения
              </div>
              <Button onClick={saveSettings} disabled={saving} size="sm">
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
