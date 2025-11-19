import type { Route } from "./+types/models.$filename";
import { readFile } from "fs/promises";
import { join } from "path";

export async function loader({ params }: Route.LoaderArgs) {
  const filename = params.filename;
  
  if (!filename || !filename.endsWith(".task")) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    const filePath = join(process.cwd(), "public", "models", filename);
    const fileBuffer = await readFile(filePath);
    
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(`Error serving model file ${filename}:`, error);
    throw new Response("Not Found", { status: 404 });
  }
}





