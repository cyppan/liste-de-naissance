import { useEffect, useState } from "react";
import { createClient, Session } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { I18nVariables, ThemeSupa } from "@supabase/auth-ui-shared";

const supabase = createClient(
  "https://fcqqajwrikawzflldqpo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcXFhandyaWthd3pmbGxkcXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzE3MDEsImV4cCI6MjAzNTg0NzcwMX0.AX5xSIG8GZClGy5wLGU4yPRBy2bdyr2PxlFkMhf2pDo"
);

const translations: I18nVariables = {
  sign_up: {
    button_label: "Créer un compte",
    email_input_placeholder: "Email",
    password_input_placeholder: "Mot de passe",
    confirmation_text: "Confirmer le mot de passe",
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
    link_text: "Vous n'avez pas de compte ? Créez-en un.",
  },
  magic_link: {
    link_text: "Envoyer un lien de connexion par email",
  },
  forgotten_password: {
    confirmation_text: "Confirmer le mot de passe",
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
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
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-full min-w-full gap-10">
      {/* <!-- HEADER --> */}
      <div className="w-full max-w-5xl p-2 border-solid border-b-2">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-medium">
            La liste de naissance de Manon et Cédric 👶
          </h1>

          <button
            className="btn-secondary"
            onClick={() => supabase.auth.signOut()}
          >
            Se déconnecter
          </button>
        </div>
      </div>
      {/* <!-- CONTENT --> */}
      <div>CONTENT</div>
    </div>
  );
}

export default App;
