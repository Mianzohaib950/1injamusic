import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, serverError } from "@/lib/server/http";
import { uploadMediaFile } from "@/lib/server/supabaseStorage";

export const runtime = "nodejs";

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return apiError("Video file is required", 400);
    if (!ALLOWED_VIDEO_TYPES.has(file.type)) return apiError("Use an MP4, WebM, OGG, or MOV video", 400);
    if (file.size > MAX_VIDEO_BYTES) return apiError("Video must be 100 MB or smaller", 400);

    const url = await uploadMediaFile(file, "cms/videos");
    return json({ url, fileName: file.name });
  } catch (error) {
    return serverError(error);
  }
}
