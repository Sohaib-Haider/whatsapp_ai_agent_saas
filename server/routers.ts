import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { onboardingRouter } from "./routers/onboarding";
import { conversationsRouter } from "./routers/conversations";
import { analyticsRouter } from "./routers/analytics";
import { realtimeRouter } from "./routers/realtime";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  onboarding: onboardingRouter,
  conversations: conversationsRouter,
  analytics: analyticsRouter,
  realtime: realtimeRouter,
});

export type AppRouter = typeof appRouter;
