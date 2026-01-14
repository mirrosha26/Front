import React from 'react';

export default function Loading() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2'></div>
    </div>
  );
}
