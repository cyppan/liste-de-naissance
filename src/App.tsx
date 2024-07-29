import { useEffect, useRef, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { I18nVariables, ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "./supabase";
import { Items } from "./Items";
import { WelcomeMessage } from "./WelcomeMessage";

const translations: I18nVariables = {
  sign_up: {
    button_label: "Créer un compte",
    email_input_placeholder: "Email",
    password_input_placeholder: "Mot de passe",
    confirmation_text: "Compte créé avec succès",
    loading_button_label: "Chargement...",
    email_label: "Email",
    password_label: "Mot de passe",
    link_text: "Vous n'avez pas de compte ? Créez-en un.",
  },
  sign_in: {
    button_label: "Se connecter",
    email_input_placeholder: "Email",
    password_input_placeholder: "Mot de passe",
    loading_button_label: "Chargement...",
    email_label: "Email",
    password_label: "Mot de passe",
    link_text: "Vous avez déjà un compte ? Connectez-vous.",
  },
  magic_link: {
    link_text: "Envoyer un lien de connexion par email",
  },
  forgotten_password: {
    confirmation_text: "email de réinitialisation envoyé",
    password_label: "Mot de passe",
    button_label: "Envoyer le lien",
    email_input_placeholder: "Email",
    loading_button_label: "Chargement...",
    email_label: "Email",
    link_text: "Mot de passe oublié ?",
  },
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const sessionRef = useRef<Session | null>(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setShowLoginScreen(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowLoginScreen(false);
      }
    });

    let interval: NodeJS.Timeout | undefined;
    if (!sessionRef.current) {
      interval = setInterval(() => {
        if (!sessionRef.current) {
          supabase.auth
            .getSession()
            .then(({ data: { session: refreshedSession } }) => {
              if (refreshedSession) {
                setSession(refreshedSession);
                setShowLoginScreen(false);
              }
            });
        }
      }, 1000);
    }

    return () => {
      subscription.unsubscribe();
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!session && showLoginScreen) {
    return (
      <div className="flex items-center justify-center min-h-full min-w-full">
        <div>
          <h1 className="flex flex-col text-5xl">
            <div>La liste de naissance</div>
            <div className="text-3xl">de Manon et Cédric 👶</div>
          </h1>
          <Auth
            localization={{
              variables: translations,
            }}
            magicLink
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo="https://naissance-liste.fr"
            view="sign_up"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* load Supabase CSS variables */}
      <div className="hidden">
        <Auth
          localization={{
            variables: translations,
          }}
          magicLink
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
        />
      </div>
      <div className="flex flex-col items-center min-h-full w-full max-w-5xl bg-white bg-opacity-90 mx-auto gap-10 mb-4">
        {/* <!-- HEADER --> */}
        <div className="w-full max-w-5xl p-2 md:p-4 border-solid border-b-2">
          <div className="flex justify-between items-center">
            <h1 className="text-lg md:text-2xl font-medium">
              La liste de naissance de Manon et Cédric 👶
            </h1>

            {!session ? (
              <a onClick={() => setShowLoginScreen(true)}>Me connecter</a>
            ) : (
              <a onClick={logout}>Me déconnecter</a>
            )}
          </div>
        </div>
        {/* <!-- CONTENT --> */}
        <WelcomeMessage />
        <Items
          setShowLoginScreen={setShowLoginScreen}
          className="w-full max-w-5xl mx-auto px-2 md:px-4"
        />
      </div>
    </>
  );
}

export default App;
