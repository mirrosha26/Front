import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { IconUser } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { getRelativeDate } from '../../utils/formatting';

interface AssignedMember {
  id: number | string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  assigned_by?: {
    id: number | string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  };
  assigned_at?: string;
}

interface AssignedMembersAvatarsProps {
  members?: AssignedMember[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onMemberClick?: () => void;
}

export const AssignedMembersAvatars: React.FC<AssignedMembersAvatarsProps> = ({
  members = [],
  maxVisible = 3,
  size = 'sm',
  className,
  onMemberClick
}) => {
  if (!members || members.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-9 w-9'
  };

  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = members.length - maxVisible;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className='flex -space-x-2'>
        {visibleMembers.map((member) => {
          const displayName =
            member.first_name && member.last_name
              ? `${member.first_name} ${member.last_name}`
              : member.username;
          
          const assignedByName = member.assigned_by
            ? (member.assigned_by.first_name && member.assigned_by.last_name
                ? `${member.assigned_by.first_name} ${member.assigned_by.last_name}`
                : member.assigned_by.username)
            : null;
          
          const assignedByInitials = member.assigned_by
            ? (member.assigned_by.first_name && member.assigned_by.last_name
                ? `${member.assigned_by.first_name[0]}${member.assigned_by.last_name[0]}`
                : member.assigned_by.username[0]?.toUpperCase() || '')
            : '';
          
          const assignedDate = member.assigned_at
            ? getRelativeDate(new Date(member.assigned_at).toString())
            : null;

          const tooltipContent = (
            <div className='space-y-1.5'>
              <div className='flex items-center gap-1.5'>
                <Avatar className='h-5 w-5 !rounded-md border border-background'>
                  {member.avatar && (
                    <AvatarImage
                      src={member.avatar}
                      alt={displayName}
                      className='object-cover !rounded-md'
                    />
                  )}
                  <AvatarFallback className='!rounded-md bg-primary/10 text-primary text-[9px]'>
                    {displayName[0]?.toUpperCase() || <IconUser className='h-2.5 w-2.5' />}
                  </AvatarFallback>
                </Avatar>
                <div className='text-xs'>{displayName}</div>
              </div>
              {assignedByName && (
                <>
                  <hr className='border-border' />
                  <div className='text-[10px] text-muted-foreground'>
                    Assigned by
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <Avatar className='h-3.5 w-3.5 !rounded-sm border border-background flex-shrink-0'>
                      {member.assigned_by?.avatar ? (
                        <AvatarImage
                          src={member.assigned_by.avatar}
                          alt={assignedByName}
                          className='object-cover !rounded-sm'
                        />
                      ) : null}
                      <AvatarFallback className='!rounded-sm bg-muted text-[7px]'>
                        {assignedByInitials || <IconUser className='h-1.5 w-1.5' />}
                      </AvatarFallback>
                    </Avatar>
                    <span className='text-[10px] text-muted-foreground'>{assignedByName}</span>
                  </div>
                </>
              )}
              {assignedDate && (
                <div className='text-[10px] text-muted-foreground'>
                  {assignedDate}
                </div>
              )}
            </div>
          );

          return (
            <TooltipProvider key={member.id} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
            <Avatar
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onMemberClick) {
                        onMemberClick();
                      }
                    }}
              className={cn(
                      'border-2 border-background !rounded-md overflow-hidden cursor-pointer',
                sizeClasses[size],
                'hover:z-10 hover:scale-110 transition-transform'
              )}
            >
              {member.avatar && (
                <AvatarImage
                  src={member.avatar}
                  alt={displayName}
                        className='object-cover !rounded-md'
                />
              )}
                    <AvatarFallback className='!rounded-md bg-primary/10 text-primary text-xs font-medium'>
                {displayName[0]?.toUpperCase() || <IconUser className='h-3 w-3' />}
              </AvatarFallback>
            </Avatar>
                </TooltipTrigger>
                <TooltipContent variant='theme' side='bottom' className='w-max max-w-[250px]'>
                  {tooltipContent}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      {remainingCount > 0 && (
        <span className='text-muted-foreground text-[10px] ml-1'>
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

