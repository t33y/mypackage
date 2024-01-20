"use client";

import { PropsWithChildren, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpcClient } from "../../trpc/client";
import { SessionProvider } from "next-auth/react";
import DispatcherLocationProvider from "./DispatcherLocation";

const Providers = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClientAPI] = useState(() =>
    trpcClient.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/trpc`,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
        }),
      ],
    })
  );
  return (
    <trpcClient.Provider client={trpcClientAPI} queryClient={queryClient}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <DispatcherLocationProvider>{children}</DispatcherLocationProvider>
        </QueryClientProvider>
      </SessionProvider>
    </trpcClient.Provider>
  );
};

export default Providers;
