import React from 'react';
import {
  AlertCircle,
  Building,
  DollarSign,
  EyeIcon,
  HelpCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const getRoundStatusIcon = (status: string) => {
  switch (status) {
    case 'just_raised':
      return <DollarSign className='h-4 w-4 text-green-500' />;
    case 'about_to_raise':
      return <AlertTriangle className='h-4 w-4 text-zinc-500' />;
    case 'raising_now':
      return <AlertCircle className='h-4 w-4 text-red-500' />;
    case 'may_be_raising':
      return <EyeIcon className='h-4 w-4 text-yellow-500' />;
    case 'unknown':
      return <HelpCircle className='h-4 w-4 text-zinc-500' />;
    case 'acquired':
      return <Building className='h-4 w-4 text-indigo-500' />;
    case 'gone_public':
      return <TrendingUp className='h-4 w-4 text-teal-500' />;
    default:
      return <HelpCircle className='h-4 w-4 text-zinc-500' />;
  }
};

export const RoundStatusExample = () => (
  <div className='mt-2 flex flex-wrap justify-start gap-2'>
    {[
      {
        icon: (
          <DollarSign className='me-1 h-4 w-4 stroke-[1.5] text-green-500' />
        ),
        label: 'Just Raised'
      },
      {
        icon: (
          <AlertCircle className='me-1 h-4 w-4 stroke-[1.5] text-red-500' />
        ),
        label: 'Raising Now'
      },
      {
        icon: <EyeIcon className='me-1 h-4 w-4 stroke-[1.5] text-yellow-500' />,
        label: 'May be Raising'
      },
      {
        icon: (
          <HelpCircle className='me-1 h-4 w-4 stroke-[1.5] text-zinc-500' />
        ),
        label: 'Unknown'
      },
      {
        icon: (
          <Building className='me-1 h-4 w-4 stroke-[1.5] text-indigo-500' />
        ),
        label: 'Acquired'
      },
      {
        icon: (
          <TrendingUp className='me-1 h-4 w-4 stroke-[1.5] text-teal-500' />
        ),
        label: 'Gone Public'
      }
    ].map(({ icon, label }) => (
      <div
        key={label}
        className='flex items-center space-x-1 rounded-md bg-zinc-100 px-2 py-1'
      >
        {icon}
        <span className='text-sm'>{label}</span>
      </div>
    ))}
  </div>
);
