import { createClient, Session } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { useCallback, useEffect, useState } from "react";
import { PostgrestBuilder, PostgrestError } from "@supabase/postgrest-js";

const projectId = "fcqqajwrikawzflldqpo";
export const supabase = createClient<Database>(
  `https://${projectId}.supabase.co`,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcXFhandyaWthd3pmbGxkcXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzE3MDEsImV4cCI6MjAzNTg0NzcwMX0.AX5xSIG8GZClGy5wLGU4yPRBy2bdyr2PxlFkMhf2pDo"
);

type SupabaseQueryResult<T = unknown> =
  | {
      state: "loading";
    }
  | {
      state: "error";
      error: PostgrestError;
    }
  | {
      state: "loaded";
      data: T;
    };

export function useSupabase<T>(
  query: PostgrestBuilder<T>
): SupabaseQueryResult<T> & { refresh: () => void } {
  const [state, setState] = useState<SupabaseQueryResult["state"]>("loading");
  const [error, setError] = useState<PostgrestError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const fetchData = useCallback((query: PostgrestBuilder<T>) => {
    query.then((data) => {
      if (data.error != null) {
        setError(data.error);
        setState("error");
      } else {
        setData(data.data);
        setState("loaded");
      }
    });
  }, []);

  useEffect(() => {
    void fetchData(query);
  }, [query, fetchData]);

  const refresh = useCallback(() => fetchData(query), [query, fetchData]);

  if (state === "loading") {
    return {
      state,
      refresh,
    };
  } else if (state === "error") {
    return {
      state,
      error: error!,
      refresh,
    };
  }
  return {
    state: "loaded",
    data: data!,
    refresh,
  };
}

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<Session["user"] | null>(null);
  const getCurrentUser = async () => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      return null;
    }
    return session.user;
  };
  useEffect(() => {
    void getCurrentUser().then(setCurrentUser);
  }, []);
  return currentUser
    ? {
        ...currentUser,
        isAdmin: currentUser.app_metadata?.role === "super-admin",
      }
    : null;
};

export function assertIsDefined<T>(
  currentUser: T | null,
  message: string = "Un probleme est survenu."
): asserts currentUser is T {
  if (!currentUser) {
    alert(message);
    throw new Error(message);
  }
}

export const getImageUrl = (path: string) =>
  `https://${projectId}.supabase.co/storage/v1/object/public/images/${encodeURIComponent(
    path
  )}`;
