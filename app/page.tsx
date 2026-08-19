import { Nav } from "@/components/Nav";
import { LibraryClient } from "@/components/LibraryClient";
import { listItems } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const items = listItems();

  return (
    <>
      <Nav />
      <LibraryClient initialItems={items} />
    </>
  );
}
