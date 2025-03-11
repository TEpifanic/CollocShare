"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Loader2, Home, CheckCircle2, XCircle, Bug, RefreshCw } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import * as React from "react";

interface InvitationAcceptPageProps {
  params: {
    token: string;
  };
}

type InvitationStatus = "loading" | "valid" | "expired" | "error" | "already_member" | "joined" | "debug";

export default function InvitationAcceptPage({ params }: InvitationAcceptPageProps) {
  // Nous sommes conscients de l'avertissement concernant l'accès direct à params.token
  // Dans une future version, nous devrons utiliser React.use(params)
  // @ts-ignore - Ignorer l'avertissement pour le moment
  const invitationToken = params.token;
  
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus>("loading");
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [responseDetails, setResponseDetails] = useState<any>(null);

  const checkInvitation = async () => {
    setInvitationStatus("loading");
    try {
      console.log("Vérification de l'invitation...");
      const response = await axios.get(`/api/colocation/invite/check/${invitationToken}`);
      
      console.log("Réponse de vérification:", response.data);
      setResponseDetails(response.data);
      setInvitationData(response.data);
      setInvitationStatus("valid");
    } catch (error: any) {
      console.error("Erreur lors de la vérification de l'invitation:", error);
      setErrorDetails(error);
      
      if (axios.isAxiosError(error)) {
        // Logs détaillés pour le débogage
        console.log("Status code:", error.response?.status);
        console.log("Response data:", error.response?.data);
        console.log("Headers:", error.response?.headers);
        console.log("Config:", error.config);
        
        const status = error.response?.status;
        const message = error.response?.data?.message || "";

        if (status === 404 || message.includes("expirée")) {
          setInvitationStatus("expired");
        } else if (message.includes("déjà membre")) {
          setInvitationStatus("already_member");
        } else if (status === 500) {
          // Erreur serveur - afficher un message d'erreur mais ne pas permettre de continuer
          setInvitationStatus("error");
          setErrorMessage("Une erreur serveur est survenue. Veuillez réessayer plus tard.");
          toast.error("Erreur serveur lors de la vérification de l'invitation");
        } else {
          setInvitationStatus("error");
          setErrorMessage(error.response?.data?.message || "Une erreur est survenue");
        }
      } else {
        setInvitationStatus("error");
        setErrorMessage("Une erreur est survenue lors de la vérification de l'invitation");
      }
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    checkInvitation();
  }, [invitationToken, status]);

  const handleJoinColocation = async () => {
    if (!session?.user) {
      // Rediriger vers la page de connexion avec un paramètre pour revenir ici après
      localStorage.setItem("invitationRedirect", window.location.pathname);
      router.push("/signin?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }

    // Vérifier que l'invitation est valide avant de tenter de la rejoindre
    if (invitationStatus !== "valid") {
      toast.error("L'invitation n'est pas valide. Veuillez vérifier le lien ou demander une nouvelle invitation.");
      return;
    }

    setIsJoining(true);

    try {
      console.log("Acceptation de l'invitation...");
      const response = await axios.post(`/api/colocation/invite/accept/${invitationToken}`);
      
      console.log("Réponse d'acceptation:", response.data);
      setResponseDetails(response.data);
      
      toast.success("Vous avez rejoint la colocation avec succès !");
      setInvitationStatus("joined");
      
      // Rediriger vers la page de la colocation après un court délai
      setTimeout(() => {
        router.push(`/colocations/${response.data.colocationId}`);
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de l'acceptation de l'invitation:", error);
      setErrorDetails(error);
      
      if (axios.isAxiosError(error)) {
        // Logs détaillés pour le débogage
        console.log("Status code:", error.response?.status);
        console.log("Response data:", error.response?.data);
        console.log("Headers:", error.response?.headers);
        console.log("Config:", error.config);
        
        const message = error.response?.data?.message || "Erreur lors de l'acceptation de l'invitation";
        
        // Si l'erreur indique que l'utilisateur est déjà membre
        if (message.includes("déjà membre")) {
          setInvitationStatus("already_member");
          toast.success("Vous êtes déjà membre de cette colocation");
        } else {
          setInvitationStatus("error");
          toast.error(message);
          setErrorMessage(message);
        }
      } else {
        toast.error("Une erreur est survenue lors de l'acceptation de l'invitation");
        setErrorMessage("Une erreur est survenue lors de l'acceptation de l'invitation");
        setInvitationStatus("error");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const switchToDebugMode = () => {
    setInvitationStatus("debug");
  };

  // Fonction pour réessayer la vérification
  const retryCheckInvitation = () => {
    checkInvitation();
  };

  const renderContent = () => {
    switch (invitationStatus) {
      case "loading":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Vérification de l'invitation...</CardTitle>
              <CardDescription>Veuillez patienter pendant que nous vérifions votre invitation.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Loader2 className="h-16 w-16 animate-spin text-indigo-500" />
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" size="sm" onClick={switchToDebugMode}>
                <Bug className="mr-2 h-4 w-4" />
                Mode débogage
              </Button>
            </CardFooter>
          </Card>
        );

      case "valid":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Invitation valide</CardTitle>
              <CardDescription>
                Vous êtes invité à rejoindre la colocation "{invitationData?.colocation?.name}".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                En rejoignant cette colocation, vous pourrez :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 mb-6">
                <li>Accéder aux dépenses partagées</li>
                <li>Participer aux tâches ménagères</li>
                <li>Gérer les listes de courses</li>
                <li>Communiquer avec vos colocataires</li>
              </ul>
              
              {!session?.user && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800 mb-4">
                  Vous devrez vous connecter ou créer un compte pour rejoindre cette colocation.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 justify-between">
              <Button variant="outline" asChild>
                <Link href="/" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  Accueil
                </Link>
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={switchToDebugMode}>
                  <Bug className="mr-2 h-4 w-4" />
                  Débogage
                </Button>
                <Button onClick={handleJoinColocation} disabled={isJoining}>
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    "Rejoindre la colocation"
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        );

      case "expired":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-800">Invitation expirée</CardTitle>
              <CardDescription>
                Cette invitation a expiré ou n'est plus valide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-6">
                <XCircle className="h-16 w-16 text-amber-500" />
              </div>
              <p className="text-sm text-slate-600 text-center">
                Veuillez demander à l'administrateur de la colocation de vous envoyer une nouvelle invitation.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={switchToDebugMode}>
                <Bug className="mr-2 h-4 w-4" />
                Débogage
              </Button>
            </CardFooter>
          </Card>
        );

      case "already_member":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Déjà membre</CardTitle>
              <CardDescription>
                Vous êtes déjà membre de cette colocation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-6">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-sm text-slate-600 text-center">
                Vous pouvez accéder à la colocation depuis votre tableau de bord.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild className="flex-1 mr-2">
                <Link href="/colocations">
                  Voir mes colocations
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={switchToDebugMode}>
                <Bug className="mr-2 h-4 w-4" />
                Débogage
              </Button>
            </CardFooter>
          </Card>
        );

      case "joined":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">Félicitations !</CardTitle>
              <CardDescription>
                Vous avez rejoint la colocation avec succès.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-6">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-sm text-slate-600 text-center">
                Vous allez être redirigé vers la page de la colocation...
              </p>
            </CardContent>
          </Card>
        );

      case "error":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-800">Erreur</CardTitle>
              <CardDescription>
                Une erreur s'est produite lors du traitement de l'invitation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-6">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <p className="text-sm text-red-600 text-center mb-4">
                {errorMessage || "Impossible de traiter cette invitation. Veuillez réessayer plus tard."}
              </p>
              <div className="flex flex-col gap-2 items-center">
                <Button variant="outline" size="sm" onClick={retryCheckInvitation}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer la vérification
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={switchToDebugMode}>
                <Bug className="mr-2 h-4 w-4" />
                Débogage
              </Button>
            </CardFooter>
          </Card>
        );
        
      case "debug":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Mode débogage</CardTitle>
              <CardDescription>
                Informations de débogage pour l'invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Token d'invitation</h3>
                <p className="text-sm bg-gray-100 p-2 rounded overflow-auto">{invitationToken}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Session</h3>
                <p className="text-sm mb-1">Status: {status}</p>
                <p className="text-sm mb-1">User ID: {session?.user?.id}</p>
                <p className="text-sm mb-1">Email: {session?.user?.email}</p>
              </div>
              
              {responseDetails && (
                <div>
                  <h3 className="font-semibold mb-2">Dernière réponse</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(responseDetails, null, 2)}
                  </pre>
                </div>
              )}
              
              {errorDetails && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Détails de l'erreur</h3>
                  <p className="text-sm mb-1">Message: {errorDetails.message}</p>
                  {axios.isAxiosError(errorDetails) && (
                    <>
                      <p className="text-sm mb-1">Status: {errorDetails.response?.status}</p>
                      <p className="text-sm mb-1">Code: {errorDetails.code}</p>
                      <div className="mt-2">
                        <h4 className="text-sm font-semibold mb-1">Données de réponse:</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(errorDetails.response?.data, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">Actions de test</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={retryCheckInvitation}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Vérifier l'invitation
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleJoinColocation}
                    disabled={!session?.user || isJoining}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        En cours...
                      </>
                    ) : (
                      "Accepter l'invitation"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Link>
              </Button>
              {invitationStatus === "debug" && invitationData && (
                <Button onClick={() => setInvitationStatus("valid")}>
                  Retour à l'invitation
                </Button>
              )}
            </CardFooter>
          </Card>
        );
    }
  };

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Invitation CollocShare</h1>
      {renderContent()}
    </div>
  );
} 