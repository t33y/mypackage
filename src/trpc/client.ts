import { createTRPCReact } from "@trpc/react-query";
import { AppRouter } from "./index";

export const trpcClient = createTRPCReact<AppRouter>({});
