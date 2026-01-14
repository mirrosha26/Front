'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';

const formSchema = z.object({
  email: z.string().email({ message: 'Пожалуйста, введите действительный email адрес' }),
  password: z
    .string()
    .min(6, { message: 'Пароль должен содержать не менее 6 символов' })
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues = {
    email: '',
    password: ''
  };

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Успешный вход!');
        router.push(callbackUrl || '/app/feeds/all-signals');
      } else {
        toast.error(result.message || 'Неверный email или пароль');
      }
    } catch (error) {
      toast.error('Произошла ошибка при входе');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-full space-y-4'
        >
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='Введите email...'
                    disabled={loading}
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
                  <Input
                    type='password'
                    placeholder='Введите пароль...'
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={loading} className='mt-4 w-full' type='submit'>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </Form>
    </>
  );
}
