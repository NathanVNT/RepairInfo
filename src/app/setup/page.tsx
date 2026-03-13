'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Loader,
  RefreshCw
} from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useAppName } from '@/lib/useAppName';

interface ConfigStatus {
  dolibarrUrl: boolean;
  apiKey: boolean;
  apiConnection: boolean;
  smtpConfigured: boolean;
}

export default function Setup() {
  return <SetupContent />;
}

function SetupContent() {
  const RUNTIME_CONFIG_CACHE_KEY = 'setup-runtime-config-cache-v1';
  const router = useRouter();
  const { appName, updateAppName, mounted } = useAppName();
  const [dolibarrUrl, setDolibarrUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [localAppName, setLocalAppName] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState('false');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [status, setStatus] = useState<ConfigStatus>({
    dolibarrUrl: false,
    apiKey: false,
    apiConnection: false,
    smtpConfigured: false,
  });
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [loadingRuntimeConfig, setLoadingRuntimeConfig] = useState(false);
  const runtimeConfigLoadedRef = useRef(false);

  useEffect(() => {
    // Charger la configuration actuelle
    const currentUrl = process.env.NEXT_PUBLIC_DOLIBARR_URL || '';
    const currentKey = process.env.NEXT_PUBLIC_DOLIBARR_API_KEY || '';
    const savedApiConnection = localStorage.getItem('api-connection-status') === 'true';
    const currentAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const currentSmtpHost = process.env.SMTP_HOST || '';
    const currentSmtpPort = process.env.SMTP_PORT || '587';
    const currentSmtpSecure = process.env.SMTP_SECURE || 'false';
    const currentSmtpUser = process.env.SMTP_USER || '';
    const currentSmtpPass = process.env.SMTP_PASS || '';
    const currentSmtpFrom = process.env.SMTP_FROM || '';
    
    setDolibarrUrl(currentUrl);
    setApiKey(currentKey);
    setAppUrl(currentAppUrl);
    setSmtpHost(currentSmtpHost);
    setSmtpPort(currentSmtpPort);
    setSmtpSecure(currentSmtpSecure);
    setSmtpUser(currentSmtpUser);
    setSmtpPass(currentSmtpPass);
    setSmtpFrom(currentSmtpFrom);

    // Vérifier le statut
    setStatus({
      dolibarrUrl: !!currentUrl,
      apiKey: !!currentKey,
      apiConnection: savedApiConnection,
      smtpConfigured: Boolean(currentSmtpHost && currentSmtpUser && currentSmtpPass && currentSmtpFrom),
    });
  }, []);

  useEffect(() => {
    if (mounted) {
      setLocalAppName(appName);
    }
  }, [appName, mounted]);

  useEffect(() => {
    const smtpIsConfigured = Boolean(smtpHost && smtpUser && smtpPass && smtpFrom);
    setStatus((prev) => ({ ...prev, smtpConfigured: smtpIsConfigured }));
  }, [smtpHost, smtpUser, smtpPass, smtpFrom]);

  useEffect(() => {
    const loadRuntimeConfig = async () => {
      if (runtimeConfigLoadedRef.current) {
        return;
      }

      runtimeConfigLoadedRef.current = true;
      setLoadingRuntimeConfig(true);

      try {
        try {
          const cachedConfig = sessionStorage.getItem(RUNTIME_CONFIG_CACHE_KEY);
          if (cachedConfig) {
            const data = JSON.parse(cachedConfig);
            const serverDolibarrUrl = String(data?.dolibarrUrl || '').trim();
            const serverApiKey = String(data?.apiKey || '').trim();
            const serverAppName = String(data?.appName || '').trim();
            const serverAppUrl = String(data?.appUrl || '').trim();
            const serverSmtpHost = String(data?.smtpHost || '').trim();
            const serverSmtpPort = String(data?.smtpPort || '').trim();
            const serverSmtpSecure = String(data?.smtpSecure || '').trim();
            const serverSmtpUser = String(data?.smtpUser || '').trim();
            const serverSmtpPass = String(data?.smtpPass || '');
            const serverSmtpFrom = String(data?.smtpFrom || '').trim();

            if (serverDolibarrUrl) setDolibarrUrl(serverDolibarrUrl);
            if (serverApiKey) setApiKey(serverApiKey);
            if (serverAppName) {
              setLocalAppName(serverAppName);
              updateAppName(serverAppName);
            }

            if (serverAppUrl) setAppUrl(serverAppUrl);
            if (serverSmtpHost) setSmtpHost(serverSmtpHost);
            if (serverSmtpPort) setSmtpPort(serverSmtpPort);
            if (serverSmtpSecure) setSmtpSecure(serverSmtpSecure);
            if (serverSmtpUser) setSmtpUser(serverSmtpUser);
            if (serverSmtpPass) setSmtpPass(serverSmtpPass);
            if (serverSmtpFrom) setSmtpFrom(serverSmtpFrom);

            setStatus((prev) => ({
              ...prev,
              dolibarrUrl: prev.dolibarrUrl || Boolean(serverDolibarrUrl),
              apiKey: prev.apiKey || Boolean(serverApiKey),
            }));

            return;
          }
        } catch (_) {
          // sessionStorage indisponible ou cache invalide
        }

        const response = await fetch('/api/setup/config', { cache: 'no-store' });

        if (!response.ok) return;

        const data = await response.json();
        try {
          sessionStorage.setItem(RUNTIME_CONFIG_CACHE_KEY, JSON.stringify(data));
        } catch (_) {
          // sessionStorage indisponible
        }
        const serverDolibarrUrl = String(data?.dolibarrUrl || '').trim();
        const serverApiKey = String(data?.apiKey || '').trim();
        const serverAppName = String(data?.appName || '').trim();
        const serverAppUrl = String(data?.appUrl || '').trim();
        const serverSmtpHost = String(data?.smtpHost || '').trim();
        const serverSmtpPort = String(data?.smtpPort || '').trim();
        const serverSmtpSecure = String(data?.smtpSecure || '').trim();
        const serverSmtpUser = String(data?.smtpUser || '').trim();
        const serverSmtpPass = String(data?.smtpPass || '');
        const serverSmtpFrom = String(data?.smtpFrom || '').trim();

        if (serverDolibarrUrl) setDolibarrUrl(serverDolibarrUrl);
        if (serverApiKey) setApiKey(serverApiKey);
        if (serverAppName) {
          setLocalAppName(serverAppName);
          updateAppName(serverAppName);
        }

        if (serverAppUrl) setAppUrl(serverAppUrl);
        if (serverSmtpHost) setSmtpHost(serverSmtpHost);
        if (serverSmtpPort) setSmtpPort(serverSmtpPort);
        if (serverSmtpSecure) setSmtpSecure(serverSmtpSecure);
        if (serverSmtpUser) setSmtpUser(serverSmtpUser);
        if (serverSmtpPass) setSmtpPass(serverSmtpPass);
        if (serverSmtpFrom) setSmtpFrom(serverSmtpFrom);

        setStatus((prev) => ({
          ...prev,
          dolibarrUrl: prev.dolibarrUrl || Boolean(serverDolibarrUrl),
          apiKey: prev.apiKey || Boolean(serverApiKey),
        }));

      } catch (error) {
        console.error('Erreur chargement config runtime:', error);
      } finally {
        setLoadingRuntimeConfig(false);
      }
    };

    loadRuntimeConfig();
  }, []);

  const getSetupPayload = () => ({
    dolibarrUrl,
    apiKey,
    appName: localAppName,
    appUrl,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    smtpFrom,
  });

  const saveAllSetupData = async () => {
    if (!localAppName.trim() || !dolibarrUrl.trim() || !apiKey.trim()) {
      alert('Veuillez renseigner au minimum le nom de l\'application, l\'URL Dolibarr et la clé API.');
      return;
    }

    setSavingAll(true);
    try {
      const response = await fetch('/api/setup/config', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getSetupPayload()),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Impossible de sauvegarder les données de configuration');
      }

      const savedConfig = await response.json().catch(() => null);
      if (savedConfig) {
        try {
          sessionStorage.setItem(RUNTIME_CONFIG_CACHE_KEY, JSON.stringify(savedConfig));
        } catch (_) {
          // sessionStorage indisponible
        }
        setDolibarrUrl(String(savedConfig.dolibarrUrl ?? dolibarrUrl));
        setApiKey(String(savedConfig.apiKey ?? apiKey));
        setLocalAppName(String(savedConfig.appName ?? localAppName));
        setAppUrl(String(savedConfig.appUrl ?? appUrl));
        setSmtpHost(String(savedConfig.smtpHost ?? smtpHost));
        setSmtpPort(String(savedConfig.smtpPort ?? smtpPort));
        setSmtpSecure(String(savedConfig.smtpSecure ?? smtpSecure));
        setSmtpUser(String(savedConfig.smtpUser ?? smtpUser));
        setSmtpPass(String(savedConfig.smtpPass ?? smtpPass));
        setSmtpFrom(String(savedConfig.smtpFrom ?? smtpFrom));
      }

      localStorage.setItem('api-connection-status', String(status.apiConnection));
      if (savedConfig?.envFileUpdated === false && savedConfig?.envFileWarning) {
        alert(`Toutes les données de /setup ont été sauvegardées.\n\n${String(savedConfig.envFileWarning)}`);
      } else {
        alert('Toutes les données de /setup ont été sauvegardées et .env.local a été mis à jour.');
      }
    } catch (error) {
      console.error('Erreur sauvegarde complète:', error);
      alert('Erreur lors de la sauvegarde complète de /setup');
    } finally {
      setSavingAll(false);
    }
  };

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
    if (!localAppName.trim() || !dolibarrUrl.trim() || !apiKey.trim()) {
      alert('Veuillez renseigner au minimum le nom de l\'application, l\'URL Dolibarr et la clé API avant de sauvegarder');
      return;
    }

    setSaving(true);
    
    try {
      const runtimeSaveResponse = await fetch('/api/setup/config', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getSetupPayload()),
      });

      if (!runtimeSaveResponse.ok) {
        const errorData = await runtimeSaveResponse.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Impossible de sauvegarder le nom de l\'application');
      }

      const savedConfig = await runtimeSaveResponse.json().catch(() => null);
      if (savedConfig) {
        try {
          sessionStorage.setItem(RUNTIME_CONFIG_CACHE_KEY, JSON.stringify(savedConfig));
        } catch (_) {
          // sessionStorage indisponible
        }
        setDolibarrUrl(String(savedConfig.dolibarrUrl ?? dolibarrUrl));
        setApiKey(String(savedConfig.apiKey ?? apiKey));
        setLocalAppName(String(savedConfig.appName ?? localAppName));
        setAppUrl(String(savedConfig.appUrl ?? appUrl));
        setSmtpHost(String(savedConfig.smtpHost ?? smtpHost));
        setSmtpPort(String(savedConfig.smtpPort ?? smtpPort));
        setSmtpSecure(String(savedConfig.smtpSecure ?? smtpSecure));
        setSmtpUser(String(savedConfig.smtpUser ?? smtpUser));
        setSmtpPass(String(savedConfig.smtpPass ?? smtpPass));
        setSmtpFrom(String(savedConfig.smtpFrom ?? smtpFrom));
      }

      const envContent = `# Configuration Dolibarr API
NEXT_PUBLIC_DOLIBARR_URL=${dolibarrUrl}
NEXT_PUBLIC_DOLIBARR_API_KEY=${apiKey}

# Configuration Application
NEXT_PUBLIC_APP_NAME=${localAppName}
NEXT_PUBLIC_APP_URL=${appUrl}

# Configuration SMTP
SMTP_HOST=${smtpHost}
SMTP_PORT=${smtpPort}
SMTP_SECURE=${smtpSecure}
SMTP_USER=${smtpUser}
SMTP_PASS=${String(savedConfig?.smtpPassEnvValue ?? smtpPass)}
SMTP_FROM=${smtpFrom}
`;

      // Créer un blob et télécharger
      const blob = new Blob([envContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '.env';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (savedConfig?.envFileUpdated === false && savedConfig?.envFileWarning) {
        alert(`Configuration sauvegardée.\n\n${String(savedConfig.envFileWarning)}\n\nLe fichier .env a aussi été téléchargé: placez-le à la racine du projet puis redémarrez le serveur.`);
      } else {
        alert('Configuration sauvegardée. Le nom d\'application et les paramètres SMTP sont appliqués immédiatement aux e-mails.\n\nLe fichier .env du projet a été mis à jour et un .env a aussi été téléchargé. Redémarrez le serveur pour recharger les variables d\'environnement.');
      }
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du fichier');
    } finally {
      setSaving(false);
    }
  };

  const allConfigured = status.dolibarrUrl && status.apiKey && status.apiConnection;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card padding={false} className="p-4 dark:border dark:border-slate-800">
            <div className="flex items-center">
              {status.dolibarrUrl ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">URL Dolibarr</span>
            </div>
          </Card>
          <Card padding={false} className="p-4 dark:border dark:border-slate-800">
            <div className="flex items-center">
              {status.apiKey ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Clé API</span>
            </div>
          </Card>
          <Card padding={false} className="p-4 dark:border dark:border-slate-800">
            <div className="flex items-center">
              {status.apiConnection ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Connexion API</span>
            </div>
          </Card>
          <Card padding={false} className="p-4 dark:border dark:border-slate-800">
            <div className="flex items-center">
              {status.smtpConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">SMTP</span>
            </div>
          </Card>
        </div>

        {/* Configuration Form */}
        <Card className="dark:border dark:border-slate-800">
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
              helperText="Le nom apparaîtra dans l'interface, le titre du navigateur et l'expéditeur des e-mails"
            />

            <Input
              label="URL publique de l'application"
              placeholder="https://atelier.mondomaine.fr"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              helperText="Utilisée pour les liens de suivi dans les e-mails"
            />

            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 pt-2">Configuration SMTP</h3>

            <Input
              label="SMTP Host"
              placeholder="smtp.votre-fournisseur.com"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="SMTP Port"
                placeholder="587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
              />
              <Input
                label="SMTP Secure"
                placeholder="false ou true"
                value={smtpSecure}
                onChange={(e) => setSmtpSecure(e.target.value)}
                helperText="`true` pour SSL direct (souvent port 465)"
              />
            </div>

            <Input
              label="SMTP User"
              placeholder="utilisateur smtp"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
            />

            <Input
              label="SMTP Password"
              type="password"
              placeholder="mot de passe smtp"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
            />

            <Input
              label="Adresse expéditeur"
              placeholder="no-reply@votredomaine.fr"
              value={smtpFrom}
              onChange={(e) => setSmtpFrom(e.target.value)}
              helperText="Le nom affiché sera automatiquement le nom de l'application"
            />
            {loadingRuntimeConfig && (
              <p className="text-sm text-gray-500 dark:text-slate-400">Chargement de la configuration serveur...</p>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`mt-6 p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900' 
                : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'
            }`}>
              <div className="flex items-start">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                )}
                <p className={`text-sm ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                } dark:text-slate-100`}>
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
              onClick={saveAllSetupData}
              disabled={savingAll || !localAppName.trim() || !dolibarrUrl.trim() || !apiKey.trim()}
              className="flex-1"
              variant="success"
            >
              {savingAll ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Sauvegarde complète...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Sauvegarder toutes les données
                </>
              )}
            </Button>

            <Button
              onClick={saveConfiguration}
              disabled={saving || !localAppName.trim() || !dolibarrUrl.trim() || !apiKey.trim()}
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
        <Card className="mt-6 dark:border dark:border-slate-800">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Guide de configuration Dolibarr
          </h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-slate-400">
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
          <div className="mt-4 p-3 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-slate-700">
            <p className="text-sm text-blue-800 dark:text-slate-200">
              📘 Pour plus de détails, consultez le fichier <code className="bg-blue-100 px-1 rounded">DOLIBARR_CONFIG.md</code>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
