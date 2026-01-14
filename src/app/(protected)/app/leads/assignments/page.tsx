import { permanentRedirect } from 'next/navigation';

export default function AssignmentsPageWrapper() {
  permanentRedirect('/app/leads/crm');
}

