import { FC, useRef, useState } from "react";
import {
  MDXEditor,
  toolbarPlugin,
  headingsPlugin,
  linkDialogPlugin,
  tablePlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertTable,
  linkPlugin,
  MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import {
  assertIsDefined,
  getImageUrl,
  supabase,
  useCurrentUser,
} from "./supabase";
import { Session } from "@supabase/supabase-js";
import { Database } from "./database.types";

type ItemFormProps = {
  className?: string;
  item?: Omit<
    Database["public"]["Tables"]["items"]["Row"],
    "created_at" | "updated_at"
  >;
  onSaveItem: () => void;
};

const getItemFromForm = async (
  form: HTMLFormElement,
  description: string | undefined,
  imageUrl: string | null,
  currentUser: Session["user"]
) => {
  const formData = new FormData(form);
  const name = formData.get("item_name") as string;
  const file = formData.get("item_image") as File;
  let fileNameHash = "";
  if (file.name) {
    const extension = file.name.split(".").pop();
    fileNameHash = `${encodeURIComponent(btoa(file.name))}.${extension}`;
    const { error } = await supabase.storage
      .from("images")
      .upload(fileNameHash, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (error && !error.message.includes("The resource already exists")) {
      const message =
        "Un probleme est survenu lors de l'envoi de l'image. " + error.message;
      alert(message);
      throw new Error(message);
    }
  }
  const newImageUrl = fileNameHash ? getImageUrl(fileNameHash) : imageUrl;
  return {
    name,
    description,
    user_id: currentUser.id,
    image_url: newImageUrl,
  };
};

export const ItemForm: FC<ItemFormProps> = ({
  item,
  onSaveItem,
  className,
}) => {
  const mdEditorRef = useRef<MDXEditorMethods>(null);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const currentUser = useCurrentUser();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(
    item?.image_url ?? null
  );
  const [description, setDescription] = useState<string | undefined>(
    item?.description ?? undefined
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    assertIsDefined(currentUser);
    const form = e.currentTarget as HTMLFormElement;
    setIsFormDisabled(true);
    const itemToSave = await getItemFromForm(
      form,
      description,
      selectedImageUrl,
      currentUser
    );
    if (item?.id) {
      await supabase.from("items").update(itemToSave).eq("id", item.id);
    } else {
      await supabase.from("items").insert(itemToSave);
    }
    form.reset();
    setDescription(undefined);
    setSelectedImageUrl(null);
    mdEditorRef.current?.setMarkdown("");
    onSaveItem();
    setIsFormDisabled(false);
  };

  const formImageUrl = selectedImageUrl || item?.image_url;

  if (!currentUser) {
    return null;
  }

  return (
    <form
      className={`w-full max-w-5xl mx-auto border rounded-md p-4 ${
        className ? className : ""
      }`}
      onSubmit={handleSubmit}
    >
      <fieldset className="flex gap-4" disabled={isFormDisabled}>
        <label className="relative flex items-center justify-center w-48 h-48 bg-slate-100 p-2">
          {formImageUrl && (
            <img
              className="w-full h-full object-cover opacity-50"
              src={formImageUrl}
              alt={item?.name}
            />
          )}
          <input
            className="absolute top-1/2 left-0 -translate-y-1/2 max-w-full"
            type="file"
            name="item_image"
            accept="image/*"
            onChange={(e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  setSelectedImageUrl(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>
        <div className="flex flex-col grow gap-2">
          <label className="flex flex-col">
            Nom du cadeau
            <input
              className="input grow"
              required
              type="text"
              name="item_name"
              placeholder="des couches, un doudou, ..."
              defaultValue={item?.name}
            />
          </label>

          <div>
            <label>
              Description détaillée, quantité, taille, couleur, liens, ...
            </label>
            <MDXEditor
              ref={mdEditorRef}
              className="border rounded-[0.375rem]"
              markdown={description ?? ""}
              onChange={setDescription}
              plugins={[
                headingsPlugin(),
                linkPlugin(),
                tablePlugin(),
                linkDialogPlugin(),
                toolbarPlugin({
                  toolbarContents: () => {
                    return (
                      <>
                        {" "}
                        <BoldItalicUnderlineToggles />
                        <CreateLink />
                        <InsertTable />
                        <UndoRedo />
                      </>
                    );
                  },
                }),
              ]}
            />
          </div>
        </div>
      </fieldset>
      <button className="btn-primary mt-4" type="submit">
        {item ? "mettre à jour ce cadeau" : "ajouter ce cadeau dans la liste"}
      </button>
      {item && (
        <button
          className="btn-secondary mt-2 ml-2"
          type="button"
          onClick={() => {
            onSaveItem();
          }}
        >
          annuler
        </button>
      )}
    </form>
  );
};
