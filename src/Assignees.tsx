import { FC } from "react";
import { assertIsDefined, supabase, useCurrentUser } from "./supabase";

const formatAssigneeName = (name: string) => name.split("@")[0]; //.replace(/[_.]/g, " ");

type AssigneesProps = {
  item: {
    id: string;
    max_assignees: number;
    assignees: {
      user_id: string;
      user_name: string;
      content?: string | null;
    }[];
  };
  onAssigneesChange: () => void;
  setShowLoginScreen: (show: boolean) => void;
};

const defaultAssigneeContent = "Je m'en occupe!";

export const Assignees: FC<AssigneesProps> = ({
  item,
  onAssigneesChange,
  setShowLoginScreen,
}) => {
  const currentUser = useCurrentUser();
  const currentAssignee = item.assignees.find(
    (a) => a.user_id === currentUser?.id
  );
  const assignCurrentUser = async () => {
    if (!currentUser) {
      return;
    }
    supabase
      .from("assignees")
      .insert({
        item_id: item.id,
        user_id: currentUser.id,
        user_name: currentUser.email ?? currentUser.id,
      })
      .then((data) => {
        if (data.error) {
          alert(
            "Une erreur est survenue lors de l'assignation du cadeau " +
              data.error
          );
          console.error(data.error);
          throw data.error;
        } else {
          onAssigneesChange();
        }
      });
  };

  const unassignCurrentUser = async () => {
    assertIsDefined(currentUser);
    supabase
      .from("assignees")
      .delete()
      .eq("user_id", currentUser.id)
      .eq("item_id", item.id)
      .then((data) => {
        if (data.error) {
          alert(
            "Une erreur est survenue lors de la désassignation du cadeau " +
              data.error
          );
          console.error(data.error);
          throw data.error;
        } else {
          onAssigneesChange();
        }
      });
  };

  const editAssigneeContent = async () => {
    assertIsDefined(currentUser);
    const content = prompt(
      "Vous pouvez ajouter un mot pour les parents ici :",
      currentAssignee?.content || defaultAssigneeContent
    );
    if (content) {
      const { error } = await supabase
        .from("assignees")
        .update({ content })
        .eq("user_id", currentUser.id)
        .eq("item_id", item.id);
      if (error) {
        alert(
          "Une erreur est survenue lors de la modification du cadeau " + error
        );
        console.error(error);
        throw error;
      }
      onAssigneesChange();
    }
  };

  const isCurrentUserAssigned = item.assignees.some(
    (assignee) => assignee.user_id === currentUser?.id
  );
  const canOfferGift = item.assignees.length < item.max_assignees;

  return (
    <div className="w-full flex flex-col gap-2 items-start px-4">
      {!isCurrentUserAssigned && canOfferGift && (
        <a
          title={
            currentUser
              ? "Je veux offrir ce cadeau !"
              : "Connectez vous pour offrir ce cadeau"
          }
          className={`text-lg px-2 py-1 md:ml-48`}
          onClick={() => {
            if (!currentUser) {
              setShowLoginScreen(true);
            } else {
              assignCurrentUser();
            }
          }}
        >
          {item.assignees.length === 0
            ? "☝️ Je veux offrir ce cadeau !"
            : "☝️ Je veux participer aussi au cadeau !"}
        </a>
      )}
      {!isCurrentUserAssigned && !canOfferGift && (
        <a
          className={`text-lg px-2 py-1 md:ml-48 opacity-50 hover:cursor-not-allowed`}
        >
          <span className="line-through">☝️ Je veux offrir ce cadeau !</span> Ce
          cadeau est déjà offert, merci !
        </a>
      )}
      {item.assignees.length > 0 && (
        <div className="flex gap-1 items-center w-full">
          {item.assignees.map((assignee) => (
            <div
              key={assignee.user_id}
              className="flex gap-2 items-center w-full flex-wrap"
            >
              <div className="flex items-center gap-1">
                <div className="text-xl">🎁</div>
                <div className="font-semibold">
                  {formatAssigneeName(assignee.user_name)}
                </div>{" "}
                <div className="flex-shrink-0">offre ce cadeau</div>
                {assignee.content && (
                  <div className="italic bg-stone-100 p-1 rounded-md">
                    ‟{assignee.content}”
                  </div>
                )}
              </div>
              {isCurrentUserAssigned && (
                <div className="flex gap-2 grow justify-end">
                  <a onClick={editAssigneeContent}>📝 Ajouter un mot</a>
                  <div>⎸</div>
                  <a onClick={unassignCurrentUser}>❌ ne plus offrir</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
