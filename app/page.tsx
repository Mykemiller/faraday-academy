import { redirect } from "next/navigation";

// The lobby lives at /academy (spec §0). Home redirects there.
export default function Home() {
  redirect("/academy");
}
