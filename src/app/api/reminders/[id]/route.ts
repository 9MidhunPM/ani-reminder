import { handlers } from "@/lib/api-reminder-runtime";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handlers.PATCH(request, (await params).id);
}

export async function DELETE(request: Request, { params }: Params) {
  return handlers.DELETE(request, (await params).id);
}
