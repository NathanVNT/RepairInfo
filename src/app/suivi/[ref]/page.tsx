import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const statutLabels: Record<string, string> = {
  en_attente: 'En attente',
  diagnostic: 'Diagnostic',
  en_reparation: 'En réparation',
  en_attente_piece: 'En attente pièce',
  terminee: 'Terminée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const statutClasses: Record<string, string> = {
  en_attente: 'bg-gray-100 text-gray-800',
  diagnostic: 'bg-blue-100 text-blue-800',
  en_reparation: 'bg-yellow-100 text-yellow-800',
  en_attente_piece: 'bg-orange-100 text-orange-800',
  terminee: 'bg-green-100 text-green-800',
  livree: 'bg-purple-100 text-purple-800',
  annulee: 'bg-red-100 text-red-800',
};

export default async function SuiviReparationPage({
  params,
}: {
  params: { ref: string };
}) {
  const ref = decodeURIComponent(params.ref);

  const reparation = await prisma.reparation.findUnique({
    where: { ref },
    include: {
      historique: {
        where: { visible_client: true },
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!reparation) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Suivi réparation</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{reparation.ref}</h1>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                statutClasses[reparation.statut] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {statutLabels[reparation.statut] || reparation.statut}
            </span>
            <span className="text-sm text-gray-500">
              Déposé le {new Date(reparation.date_depot).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails appareil</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Client</p>
              <p className="font-medium text-gray-900">{reparation.client_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Appareil</p>
              <p className="font-medium text-gray-900">{reparation.appareil}</p>
            </div>
            {reparation.marque && (
              <div>
                <p className="text-gray-500">Marque / Modèle</p>
                <p className="font-medium text-gray-900">{reparation.marque} {reparation.modele}</p>
              </div>
            )}
            {reparation.numero_serie && (
              <div>
                <p className="text-gray-500">Numéro de série</p>
                <p className="font-medium text-gray-900">{reparation.numero_serie}</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-gray-500 text-sm">Panne déclarée</p>
            <p className="text-gray-900 mt-1">{reparation.description_panne}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique client</h2>
          {reparation.historique.length === 0 ? (
            <p className="text-gray-500">Aucun suivi disponible pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {reparation.historique.map((item) => (
                <li key={item.id} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-500">{new Date(item.date).toLocaleString('fr-FR')}</p>
                  <p className="font-medium text-gray-900 mt-1">{item.action}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Retour accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
