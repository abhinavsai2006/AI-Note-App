"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLocalNote } from "@/lib/localNotes";

export default function NewNotePage() {
  const router = useRouter();

  useEffect(() => {
    const note = createLocalNote();
    router.replace(`/notes/${note.id}`);
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-gray-600">
      Creating a new note...
    </div>
  );
}