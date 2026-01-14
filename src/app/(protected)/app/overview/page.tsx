import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken');

  if (!accessToken?.value) {
    return redirect('/auth/sign-in');
  } else {
    redirect('app/feeds/all-signals');
  }
}
