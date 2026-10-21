import { useEffect, useState } from "react";
import { useAuth } from "../state/AuthContext";
import { requireSupabase } from "../services/supabase";
import { initials } from "../lib/utils";
export function Avatar({
  name,
  path,
  demoImage,
  size = 40,
}: {
  name: string;
  path?: string | null;
  demoImage?: string | null;
  size?: number;
}) {
  const { demo } = useAuth(),
    [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    setUrl("");
    if (path && !demo)
      requireSupabase()
        .storage.from("avatars")
        .createSignedUrl(path, 1800)
        .then(({ data }) => {
          if (active) setUrl(data?.signedUrl || "");
        });
    return () => {
      active = false;
    };
  }, [path, demo]);
  const src = demo && demoImage ? demoImage : url;
  return (
    <span
      className="avatar profile-avatar"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={`Foto de ${name}`} onError={() => setUrl("")} />
      ) : (
        <span aria-label={name}>{initials(name)}</span>
      )}
    </span>
  );
}
