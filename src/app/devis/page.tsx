import { redirect } from 'next/navigation';

export default function DevisPage() {
  redirect('/factures?tab=devis');
}
