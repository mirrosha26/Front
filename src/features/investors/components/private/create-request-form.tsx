'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { IconPlus } from '@tabler/icons-react';
import { usePrivateInvestors } from '../../contexts/private-investors-context';

export const CreateRequestForm = () => {
  const { createPrivateInvestorRequest } = usePrivateInvestors();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    additional_name: '',
    twitter_headline: '',
    linkedin_headline: '',
    product_hunt_headline: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);

    const success = await createPrivateInvestorRequest(formData);

    if (success) {
      setFormData({
        name: '',
        additional_name: '',
        twitter_headline: '',
        linkedin_headline: '',
        product_hunt_headline: ''
      });
      setOpen(false);
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='gap-2'>
          <IconPlus className='h-4 w-4' />
          Add Investor
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Add Investor Request</DialogTitle>
          <DialogDescription>
            Fill in the information about the investor you want to add to the
            system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Investor Name *</Label>
              <Input
                id='name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='Enter investor name'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='twitter_headline'>Twitter</Label>
              <Input
                id='twitter_headline'
                name='twitter_headline'
                value={formData.twitter_headline}
                onChange={handleChange}
                placeholder='Example: @username'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='linkedin_headline'>LinkedIn</Label>
              <Input
                id='linkedin_headline'
                name='linkedin_headline'
                value={formData.linkedin_headline}
                onChange={handleChange}
                placeholder='Example: linkedin.com/in/username'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='product_hunt_headline'>Product Hunt</Label>
              <Input
                id='product_hunt_headline'
                name='product_hunt_headline'
                value={formData.product_hunt_headline}
                onChange={handleChange}
                placeholder='Example: @username'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='submit'
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
