import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

// LinkedIn Tags for filtering
export const LINKEDIN_TAGS = [
  'Accenture',
  'Adobe',
  'Aerospace',
  'Ai/tech',
  'Amazon',
  'Amazon Studios',
  'Amazon Web Services',
  'Andreessen Horowitz',
  'Angel Investing',
  'Angel Investor',
  'Apple',
  'Apple Computers',
  'Areply',
  'Arizona State University',
  'Asian Institute of Management',
  'Atlassian',
  'Avionics',
  'BMW Group',
  'BYWU',
  'Blue Origin',
  'Bocconi University',
  'Boston Consulting Group',
  'Brown University',
  'Bytedance',
  'Campaigns',
  'Cargurus',
  'Carnegie Mellon University',
  'Chief',
  'Cisco Systems',
  'City University of Hong Kong',
  'Cloud & Infrastructure Expert',
  'Co-founder',
  'Coinbase',
  'Columbia University',
  'Comms Leadership',
  'Continuous Improvement',
  'Cornell University',
  'Credit Suisse',
  'Darden',
  'Debugging',
  'Declared Founder',
  'Defensetech',
  'Dropbox',
  'Dublin',
  'Dwqwd',
  'Education: Y Combinator',
  'Enterprise Events Leadership',
  'Executive Coaching',
  'Executive Leadership',
  'Founder Experience (mamo)',
  'Founder Fellow at South Park Commons',
  'Founder with Exit',
  'Fruit Ninja',
  'Fruit Ninja Korea',
  'Fudan University',
  'Futurestack Leadership',
  'Gaming',
  'Georgia Institute of Technology',
  'Global Operations',
  'Global Partner Summit',
  'Goldman Sachs',
  'Gong',
  'Google',
  'Growth Strategy',
  'Gumi Asia',
  'Hardwareengineering',
  'Harvard University',
  'Harvey Mudd College',
  'IBM',
  'IE Business School',
  'IIT Roorkee',
  'Imminent Founder',
  'Imperial College London',
  'Instagram',
  'Intel Corporation',
  'Kellogg School of Management',
  'Kleiner Perkins Caufield & Byers',
  'Leadership',
  'Lean Manufacturing',
  'Left-to-build',
  'London Business School',
  'MUMTAZ Games',
  'Manufacturing',
  'Massachusetts Institute of Technology',
  'Mcgill University',
  'Mentor Program - AIM',
  'Meta',
  'Microsoft',
  'NVIDIA',
  'Netflix',
  'New Venture Start Up / NPI',
  'New York University',
  'Nomura',
  'Northeastern University',
  'Openai',
  'Operations Leadership',
  'Oracle Corporation',
  'PCB/PCBA',
  'Palantir Technologies',
  'Profound',
  'Public Policy',
  'Public Speaking',
  'RISD',
  'Rippling',
  'Saas',
  'Sales',
  'Sales Leadership',
  'Salesforce',
  'Seattle-based',
  'Shanghai Jiao Tong University',
  'Snap Inc.',
  'Software_engineering',
  'Stanford University',
  'Startup Advisory',
  'Startup Studio',
  'Startup_founder',
  'Stripe',
  'Supply Chain Management',
  'TNIMBLE',
  'Technion - Israel Institute of Technology',
  'The London School of Economics and Political Science',
  'The Wharton School',
  'Trinity College Dublin',
  'Tufts University',
  'US Naval Academy',
  'UX Design',
  'Uber',
  'Ubitus',
  'University of California, Berkeley',
  'University of California, Los Angeles',
  'University of Cambridge',
  'University of Illinois Urbana-champaign',
  'University of Michigan',
  'University of Oxford',
  'University of Pennsylvania',
  'University of Southern California',
  'University of Toronto',
  'University of Waterloo',
  'Weill Cornell Graduate School of Medical Sciences',
  'Western Digital',
  'YC S22',
  'Yale University'
];

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Лента',
    url: '/app/feeds/all-signals',
    icon: 'dashboard',
    isActive: true,
    shortcut: ['s', 'a'],
    activePaths: ['/app/feeds/all-signals', '/app/feeds', '/app'],
    items: [] // No subcategories
  },
  {
    title: 'Сигналы',
    url: '/app/leads',
    icon: 'kanban',
    isActive: true,
    items: [
      {
        title: 'Сохраненные',
        url: '/app/leads/saved',
        shortcut: ['s', 's'],
        activePaths: ['/app/leads/saved', '/app/leads']
      },
      {
        title: 'Скрытые',
        url: '/app/leads/hidden',
        shortcut: ['m', 'm']
      },
      {
        title: 'С заметками',
        url: '/app/leads/notes',
        shortcut: ['n', 'c']
      },
      {
        title: 'CRM',
        url: '/app/leads/crm',
        shortcut: ['i', 'p']
      }
    ]
  },
  {
    title: 'Инвесторы',
    url: '/app/investors',
    icon: 'user2',
    shortcut: ['i', 'i'],
    isActive: true,
    items: [] // No child items
  },
  {
    title: 'Контакты основателей',
    url: '/app/founder-contacts',
    icon: 'messagePlus',
    shortcut: ['f', 'f'],
    isActive: false,
    items: [] // No child items
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
