import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  en_attente: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  diagnostic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  en_reparation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  en_attente_piece: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  terminee: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  livree: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  annulee: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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

  let appName = 'Atelier Informatique';
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ value: string }>>(
      'SELECT "value" FROM "AppConfig" WHERE "key" = ?', 'app_name'
    );
    if (rows?.[0]?.value) appName = rows[0].value;
  } catch { /* table may not exist yet */ }

  if (!reparation) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{appName}</span>
          <ThemeToggle />
        </div>
      </header>

    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Suivi réparation</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{reparation.ref}</h1>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                statutClasses[reparation.statut] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {statutLabels[reparation.statut] || reparation.statut}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Déposé le {new Date(reparation.date_depot).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Détails appareil</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Client</p>
              <p className="font-medium text-gray-900 dark:text-white">{reparation.client_name}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Appareil</p>
              <p className="font-medium text-gray-900 dark:text-white">{reparation.appareil}</p>
            </div>
            {reparation.marque && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Marque / Modèle</p>
                <p className="font-medium text-gray-900 dark:text-white">{reparation.marque} {reparation.modele}</p>
              </div>
            )}
            {reparation.numero_serie && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Numéro de série</p>
                <p className="font-medium text-gray-900 dark:text-white">{reparation.numero_serie}</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Panne déclarée</p>
            <p className="text-gray-900 dark:text-gray-100 mt-1">{reparation.description_panne}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historique client</h2>
          {reparation.historique.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Aucun suivi disponible pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {reparation.historique.map((item) => (
                <li key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.date).toLocaleString('fr-FR')}</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{item.action}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
