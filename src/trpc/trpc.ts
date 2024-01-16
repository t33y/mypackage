// import { getAuthSession } from "@/auth";
import { getAuthSession } from "@/auth";
import { initTRPC } from "@trpc/server";

export const createTRPCContext = async () => {
  const session = await getAuthSession();
  return {
    session,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new Error("UNAUTHORIZED");
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
