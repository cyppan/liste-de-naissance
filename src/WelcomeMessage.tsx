import { useMemo, useState } from "react";
import { supabase, useCurrentUser, useSupabase } from "./supabase";
import MarkdownPreview from "@uiw/react-markdown-preview";
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
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

export const WelcomeMessage = () => {
  const [messageEditing, setMessageEditing] = useState("");
  const messageResult = useSupabase(
    useMemo(() => supabase.from("welcome_message").select("*"), [])
  );
  const currentUser = useCurrentUser();

  const handleSave = async () => {
    await supabase
      .from("welcome_message")
      .update({ content: messageEditing })
      .eq("id", 1);
    setMessageEditing("");
    messageResult.refresh();
  };

  if (messageResult.state === "loading" || messageResult.state === "error") {
    return null;
  }

  return messageEditing ? (
    <div className="w-full px-2">
      <div className="w-full flex flex-col gap-2">
        <MDXEditor
          className="border rounded-[0.375rem]"
          markdown={messageResult.data[0].content ?? ""}
          onChange={(content) => setMessageEditing(content)}
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
        <div className="flex justify-start gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              handleSave();
            }}
          >
            Enregistrer
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setMessageEditing("");
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="w-full px-4 relative">
      <blockquote className="p-4 border-s-4 border-gray-300 bg-gray-100">
        <p className="text-xl italic font-medium leading-relaxed text-gray-900">
          <MarkdownPreview source={messageResult.data[0].content ?? ""} />
        </p>
      </blockquote>
      {/* <div className="bg-neutral-400 text-white text-lg border-2 p-4 rounded-md"></div> */}
      {currentUser?.isAdmin && (
        <a
          className="absolute top-2 right-6 text-sm"
          onClick={() => {
            setMessageEditing(messageResult.data[0].content ?? "");
          }}
        >
          📝 éditer
        </a>
      )}
    </div>
  );
};
