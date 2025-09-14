"use client";

import { useEffect } from "react";

export default function ViewCounter({ id }: { id: string }) {
  useEffect(() => {
    fetch(`/api/episodes/${id}/views`, { method: "POST" }).catch(() => {});
  }, [id]);
  return null;
}
