
"use client";
import { signIn, signOut, useSession } from "next-auth/react";


import React, { useState } from 'react';

import { api, type RouterOutputs } from "~/trpc/react";
import { NoteEditor } from "../app/_components/NoteEditor";
import { NoteCard } from "../app/_components/NoteCard";


export default function Home() {

  const { data: sessionData } = useSession();
  type Topic = RouterOutputs["topic"]["getAll"][0];

  
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const { data: topics, refetch: refetchTopics } = api.topic.getAll.useQuery(
    undefined, // no input
    {
      enabled: sessionData?.user !== undefined,
      onSuccess: (data) => {
        setSelectedTopic(selectedTopic ?? data[0] ?? null);
      },
    }
  );

  const createTopic = api.topic.create.useMutation({
    onSuccess: () => {
      void refetchTopics();
    },
  });

  const deleteTopic = api.topic.delete.useMutation({
    onSuccess: () => {
      void refetchTopics();
      setSelectedTopic(null);
    },
  });

  const { data: notes, refetch: refetchNotes } = api.note.getAll.useQuery(
    {
      topicId: selectedTopic?.id ?? "",
    },
    {
      enabled: sessionData?.user !== undefined && selectedTopic !== null,
    }
  );

  const createNote = api.note.create.useMutation({
    onSuccess: () => {
      void refetchNotes();
    },
  });

  const deleteNote = api.note.delete.useMutation({
    onSuccess: () => {
      void refetchNotes();
    },
  });

  return (
    <>
      <main>
        {/* Header */}
        <div className="navbar bg-primary text-primary-content">
          <div className="flex-1 pl-5 text-3xl font-bold">
            {sessionData?.user?.name ? `Notes for ${sessionData.user.name}` : ""}
          </div>
          <div className="flex-none gap-2">
            <div className="dropdown-end dropdown">
              {sessionData?.user ? (
                <label
                  tabIndex={0}
                  className="btn-ghost btn-circle avatar btn"
                  onClick={() => void signOut()}
                >
                  <div className="w-10 rounded-full">
                    <img
                      src={sessionData?.user?.image ?? ""}
                      alt={sessionData?.user?.name ?? ""}
                    />
                  </div>
                </label>
              ) : (
                <button
                  className="btn-ghost rounded-btn btn"
                  onClick={() => void signIn()}
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>




        {/* Content */}
        <div className="mx-5 mt-5 grid grid-cols-4 gap-2">
          <div className="px-2">
            <ul className="menu rounded-box w-56 bg-base-100 p-2">
              {topics?.map((topic) => (
                <li key={topic.id} className="flex flex-row items-center justify-between">
                  <a
                    href="#"
                    onClick={(evt) => {
                      evt.preventDefault();
                      setSelectedTopic(topic);
                    }}
                  >
                    {topic.title}
                  </a>
                  <button
                    className="btn btn-error btn-xs ml-2"
                    onClick={() => deleteTopic.mutate({ id: topic.id })}
                  >
                    Deletar
                  </button>
                </li>
              ))}
            </ul>
            <div className="divider"></div>
            <input
              type="text"
              placeholder="New Topic"
              className="input-bordered input input-sm w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createTopic.mutate({
                    title: e.currentTarget.value,
                  });
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
          <div className="col-span-3">
            <div>
              {notes?.map((note) => (
                <div key={note.id} className="mt-5">
                  <NoteCard
                    note={note}
                    onDelete={() => void deleteNote.mutate({ id: note.id })}
                  />
                </div>
              ))}
            </div>

            <NoteEditor
              onSave={({ title, content }) => {
                void createNote.mutate({
                  title,
                  content,
                  topicId: selectedTopic?.id ?? "",
                });
              }}
            />
          </div>
        </div>

      </main>
    </>
  );
};


