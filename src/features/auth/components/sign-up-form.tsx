'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRegistrationMeta } from '@/hooks/use-registration-meta';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { Check } from 'lucide-react';

// Определение схемы формы
const formSchema = z
  .object({
    first_name: z
      .string()
      .min(2, 'Имя должно содержать не менее 2 символов'),
    email: z.string().email('Введите действительный email'),
    password: z.string().min(8, 'Пароль должен содержать не менее 8 символов'),
    password_confirm: z.string().min(1, 'Подтвердите пароль'),
    user_type: z.string().min(1, 'Выберите тип пользователя')
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Пароли не совпадают',
    path: ['password_confirm']
  });

type SignUpFormValue = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Получение метаданных формы
  const {
    meta,
    loading: metaLoading,
    error: metaError
  } = useRegistrationMeta();

  const defaultValues = {
    first_name: '',
    email: '',
    password: '',
    password_confirm: '',
    user_type: ''
  };

  const form = useForm<SignUpFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: SignUpFormValue) => {
    setLoading(true);
    try {
      // Удаление password_confirm перед отправкой на сервер
      const { password_confirm, ...submitData } = data;

      const result = await register(submitData);
      if (result.success) {
        setRegistrationSuccess(true);
        toast.success('Регистрация успешна!');
        // Не перенаправлять на защищенную страницу
      } else {
        toast.error(
          result.message || 'Регистрация не удалась. Пожалуйста, проверьте ваши данные.'
        );
      }
    } catch (error) {
      toast.error('Произошла ошибка при регистрации');
      console.error('SignUpForm: Registration error', error);
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className='space-y-4 rounded-lg p-6 text-center'>
        <div className='bg-muted/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100'>
          <Check className='h-8 w-8 text-zinc-800' strokeWidth={2.5} />
        </div>
        <h3 className='text-xl font-semibold'>Регистрация успешна!</h3>
        <p>
          Спасибо за регистрацию. Ваш аккаунт ожидает активации. Мы свяжемся
          с вами в ближайшее время для предоставления демо-доступа.
        </p>
        <p className='mt-4'>
          Дополнительная информация о демо-доступе и наших контактах{' '}
          <a
            href='https://shadowed-orca-caa.notion.site/Unlock-Investment-Opportunities-13bcce41ba8e8047aac7f00b2b13f69b'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:underline'
          >
            <strong>здесь</strong>
          </a>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='flex flex-col space-y-2 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Создать аккаунт
        </h1>
        <p className='text-muted-foreground text-sm'>
          Заполните форму ниже для регистрации
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-full space-y-4'
        >
          <FormField
            control={form.control}
            name='first_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имя</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Введите ваше имя'
                    disabled={loading || metaLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='Введите ваш email'
                    disabled={loading || metaLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Введите пароль'
                      disabled={loading || metaLoading}
                      {...field}
                    />
                    <button
                      type='button'
                      className='absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <IconEyeOff size={18} />
                      ) : (
                        <IconEye size={18} />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password_confirm'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Подтвердите пароль</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='Повторите пароль'
                      disabled={loading || metaLoading}
                      {...field}
                    />
                    <button
                      type='button'
                      className='absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <IconEyeOff size={18} />
                      ) : (
                        <IconEye size={18} />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='user_type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип пользователя</FormLabel>
                <Select
                  disabled={loading || metaLoading}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Выберите тип пользователя' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {metaLoading ? (
                      <SelectItem value='loading' disabled>
                        Загрузка...
                      </SelectItem>
                    ) : meta &&
                      meta.user_types &&
                      meta.user_types.length > 0 ? (
                      meta.user_types.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value='empty' disabled>
                        Типы недоступны
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type='submit'
            className='w-full'
            disabled={loading || metaLoading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>
      </Form>
    </>
  );
}
