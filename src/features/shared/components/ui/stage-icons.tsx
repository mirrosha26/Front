import React from 'react';
import {
  Baby,
  School,
  Building,
  Rocket,
  TrendingUp,
  Crown,
  HelpCircle,
  Users,
  Zap
} from 'lucide-react';

export const getStageIcon = (stage: string) => {
  const stageLower = stage.toLowerCase();
  
  if (stageLower.includes('idea') || stageLower.includes('concept')) {
    return <Baby className='h-4 w-4 text-blue-500' />;
  }
  if (stageLower.includes('mvp') || stageLower.includes('prototype')) {
    return <School className='h-4 w-4 text-green-500' />;
  }
  if (stageLower.includes('early') || stageLower.includes('seed')) {
    return <Building className='h-4 w-4 text-orange-500' />;
  }
  if (stageLower.includes('growth') || stageLower.includes('scale')) {
    return <Rocket className='h-4 w-4 text-purple-500' />;
  }
  if (stageLower.includes('mature') || stageLower.includes('established')) {
    return <TrendingUp className='h-4 w-4 text-teal-500' />;
  }
  if (stageLower.includes('unicorn') || stageLower.includes('decacorn')) {
    return <Crown className='h-4 w-4 text-yellow-500' />;
  }
  if (stageLower.includes('team') || stageLower.includes('founding')) {
    return <Users className='h-4 w-4 text-indigo-500' />;
  }
  if (stageLower.includes('launch') || stageLower.includes('beta')) {
    return <Zap className='h-4 w-4 text-red-500' />;
  }
  
  return <HelpCircle className='h-4 w-4 text-zinc-500' />;
};

export const StageExample = () => (
  <div className='mt-2 flex flex-wrap justify-start gap-2'>
    {[
      {
        icon: <Baby className='me-1 h-4 w-4 stroke-[1.5] text-blue-500' />,
        label: 'Idea/Concept'
      },
      {
        icon: <School className='me-1 h-4 w-4 stroke-[1.5] text-green-500' />,
        label: 'MVP/Prototype'
      },
      {
        icon: <Building className='me-1 h-4 w-4 stroke-[1.5] text-orange-500' />,
        label: 'Early Stage'
      },
      {
        icon: <Rocket className='me-1 h-4 w-4 stroke-[1.5] text-purple-500' />,
        label: 'Growth'
      },
      {
        icon: <TrendingUp className='me-1 h-4 w-4 stroke-[1.5] text-teal-500' />,
        label: 'Mature'
      },
      {
        icon: <Crown className='me-1 h-4 w-4 stroke-[1.5] text-yellow-500' />,
        label: 'Unicorn'
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