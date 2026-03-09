'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Loader,
  RefreshCw
} from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAppName } from '@/lib/useAppName';

interface ConfigStatus {
  dolibarrUrl: boolean;
  apiKey: boolean;
  apiConnection: boolean;
}

export default function Setup() {
  return (
    <ProtectedRoute>
      <SetupContent />
    </ProtectedRoute>
  );
}

function SetupContent() {
  const router = useRouter();
  const { appName, updateAppName, mounted } = useAppName();
  const [dolibarrUrl, setDolibarrUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [localAppName, setLocalAppName] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ConfigStatus>({
    dolibarrUrl: false,
    apiKey: false,
    apiConnection: false,
  });
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Charger la configuration actuelle
    const currentUrl = process.env.NEXT_PUBLIC_DOLIBARR_URL || '';
    const currentKey = process.env.NEXT_PUBLIC_DOLIBARR_API_KEY || '';
    const savedApiConnection = localStorage.getItem('api-connection-status') === 'true';
    
    setDolibarrUrl(currentUrl);
    setApiKey(currentKey);

    // Vérifier le statut
    setStatus({
      dolibarrUrl: !!currentUrl,
      apiKey: !!currentKey,
      apiConnection: savedApiConnection,
    });
  }, []);

  useEffect(() => {
    if (mounted) {
      setLocalAppName(appName);
    }
  }, [appName, mounted]);

  const testConnection = async () => {
    if (!dolibarrUrl || !apiKey) {
      setTestResult({
        success: false,
        message: 'Veuillez remplir tous les champs requis',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      console.log('Testing connection to:', dolibarrUrl);
      
      const response = await fetch(`${dolibarrUrl}/api/index.php/products?limit=1`, {
        method: 'GET',
        headers: {
          'DOLAPIKEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status, response.ok);

      if (response.ok) {
        console.log('Connection successful!');
        localStorage.setItem('api-connection-status', 'true');
        setStatus(prev => ({ ...prev, apiConnection: true }));
        setTestResult({
          success: true,
          message: 'Connexion réussie ! L\'API Dolibarr fonctionne correctement.',
        });
      } else {
        const errorText = await response.text();
        console.log('Connection failed:', response.status, errorText);
        localStorage.setItem('api-connection-status', 'false');
        setStatus(prev => ({ ...prev, apiConnection: false }));
        setTestResult({
          success: false,
          message: `Erreur ${response.status}: ${errorText || 'Connexion impossible'}`,
        });
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      localStorage.setItem('api-connection-status', 'false');
      setStatus(prev => ({ ...prev, apiConnection: false }));
      setTestResult({
        success: false,
        message: `Erreur de connexion: ${error?.message || 'Erreur inconnue'}. Vérifiez l'URL Dolibarr et la clé API.`,
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    if (!dolibarrUrl || !apiKey) {
      alert('Veuillez remplir les champs Dolibarr avant de sauvegarder');
      return;
    }

    setSaving(true);
    
    try {
      const envContent = `# Configuration Dolibarr API
NEXT_PUBLIC_DOLIBARR_URL=${dolibarrUrl}
NEXT_PUBLIC_DOLIBARR_API_KEY=${apiKey}

# Configuration Application
NEXT_PUBLIC_APP_NAME=${localAppName}
`;

      // Créer un blob et télécharger
      const blob = new Blob([envContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '.env.local';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('Fichier .env.local téléchargé ! Placez-le à la racine du projet et redémarrez le serveur pour appliquer les changements.');
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du fichier');
    } finally {
      setSaving(false);
    }
  };

  const allConfigured = status.dolibarrUrl && status.apiKey && status.apiConnection;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuration de l'application
          </h1>
          <p className="text-gray-600">
            Connectez votre application à Dolibarr pour commencer
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card padding={false} className="p-4">
            <div className="flex items-center">
              {status.dolibarrUrl ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <span className="text-sm font-medium">URL Dolibarr</span>
            </div>
          </Card>
          <Card padding={false} className="p-4">
            <div className="flex items-center">
              {status.apiKey ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <span className="text-sm font-medium">Clé API</span>
            </div>
          </Card>
          <Card padding={false} className="p-4">
            <div className="flex items-center">
              {status.apiConnection ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <span className="text-sm font-medium">Connexion API</span>
            </div>
          </Card>
        </div>

        {/* Configuration Form */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Paramètres de connexion
          </h2>

          <div className="space-y-4">
            <Input
              label="URL Dolibarr"
              placeholder="https://votre-dolibarr.com"
              value={dolibarrUrl}
              onChange={(e) => setDolibarrUrl(e.target.value)}
              helperText="L'URL complète de votre instance Dolibarr"
            />

            <Input
              label="Clé API Dolibarr"
              type="password"
              placeholder="Votre clé API"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              helperText="Générez une clé API dans Dolibarr (Profil utilisateur → Token API)"
            />

            <Input
              label="Nom de l'application"
              placeholder="Atelier Informatique"
              value={localAppName}
              onChange={(e) => {
                setLocalAppName(e.target.value);
                updateAppName(e.target.value);
              }}
              helperText="Le nom qui apparaîtra dans l'interface et le titre du navigateur"
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`mt-6 p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                )}
                <p className={`text-sm ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={testConnection}
              disabled={testing || !dolibarrUrl || !apiKey}
              className="flex-1"
              variant="secondary"
            >
              {testing ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Tester la connexion
                </>
              )}
            </Button>

            <Button
              onClick={saveConfiguration}
              disabled={saving || !dolibarrUrl || !apiKey}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Télécharger .env.local
                </>
              )}
            </Button>
          </div>

          {allConfigured && (
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={() => router.push('/')}
                variant="success"
                className="w-full"
              >
                Accéder à l'application
              </Button>
            </div>
          )}
        </Card>

        {/* Guide */}
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Guide de configuration Dolibarr
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 font-semibold text-xs mr-3 flex-shrink-0">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">Activer l'API REST</p>
                <p>Configuration → Modules/Applications → API/WebServices</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 font-semibold text-xs mr-3 flex-shrink-0">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">Générer une clé API</p>
                <p>Profil utilisateur → Token API → Générer un nouveau token</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 font-semibold text-xs mr-3 flex-shrink-0">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Configurer CORS</p>
                <p>Configuration → API → Autorisations CORS → Ajouter votre domaine</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              📘 Pour plus de détails, consultez le fichier <code className="bg-blue-100 px-1 rounded">DOLIBARR_CONFIG.md</code>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
