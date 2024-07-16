import { FC, Fragment, useEffect, useMemo, useState } from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { supabase, useCurrentUser, useSupabase } from "./supabase";
import { ItemForm } from "./ItemForm";
import { Assignees } from "./Assignees";
import { Database } from "./database.types";

type ItemsProps = {
  className?: string;
  setShowLoginScreen: (show: boolean) => void;
};

export const Items: FC<ItemsProps> = ({ className, setShowLoginScreen }) => {
  const currentUser = useCurrentUser();
  const [itemEditing, setItemEditing] = useState<Omit<
    Database["public"]["Tables"]["items"]["Row"],
    "created_at" | "updated_at"
  > | null>(null);

  const itemsResult = useSupabase(
    useMemo(
      () =>
        supabase
          .from("items")
          .select(
            `
      id,
      name,
      description,
      image_url,
      max_assignees,
      user_id,
      assignees ( user_id, user_name, content )
    `
          )
          .order("created_at", { ascending: true }),
      []
    )
  );

  const deleteItem = async (id: string) => {
    const confirmed = confirm("Êtes-vous sûr de vouloir supprimer ce cadeau ?");
    if (!confirmed) {
      return;
    }
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      alert("Erreur lors de la suppression de l'item: " + error.message);
      console.error(error);
      throw error;
    }
    itemsResult.refresh();
  };

  useEffect(
    function refreshItemsOnConcurrentChanges() {
      const subscription = supabase
        .channel("changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
          },
          (payload) => {
            console.log("received database change", payload);
            itemsResult.refresh();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    },
    [itemsResult]
  );

  if (itemsResult.state === "loading") {
    return <div>Chargement...</div>;
  }

  if (itemsResult.state === "error") {
    return <div>Erreur: {itemsResult.error.message}</div>;
  }

  return (
    <div className={className}>
      <div>
        {itemsResult.data.map((item, i) => (
          <Fragment key={item.id}>
            {itemEditing?.id === item.id ? (
              <ItemForm
                item={itemEditing}
                onSaveItem={() => {
                  setItemEditing(null);
                  itemsResult.refresh();
                }}
              />
            ) : (
              <>
                <div
                  className="flex flex-col md:flex-row gap-4 p-2 bg-opacity-50"
                  key={item.id}
                >
                  <div className="h-48 md:w-48 min-w-48 bg-gray-100 object-cover mx-auto">
                    {item.image_url && (
                      <img
                        className="w-full h-full object-cover"
                        src={item.image_url}
                        alt={item.name}
                      />
                    )}
                  </div>
                  <div className="grow flex flex-col gap-2 bg-opacity-50">
                    <div className="flex">
                      <div className="grow text-xl font-semibold">
                        {item.name}
                      </div>
                      {currentUser?.isAdmin && (
                        <div className="flex gap-1">
                          <a
                            onClick={() => {
                              setItemEditing(item);
                            }}
                          >
                            📝 éditer
                          </a>
                          <div>⎸</div>
                          <a onClick={() => deleteItem(item.id)}>
                            ❌ supprimer
                          </a>
                        </div>
                      )}
                    </div>
                    <div>
                      <MarkdownPreview source={item.description ?? undefined} />
                    </div>
                  </div>
                </div>
                <Assignees
                  item={item}
                  onAssigneesChange={itemsResult.refresh}
                  setShowLoginScreen={setShowLoginScreen}
                />
              </>
            )}
            {i < itemsResult.data.length - 1 && <hr className="mt-2" />}
          </Fragment>
        ))}
      </div>
      <ItemForm className="my-4" onSaveItem={itemsResult.refresh} />
    </div>
  );
};
