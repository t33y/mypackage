"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";
import Link from "next/link";
import { trpcClient } from "@/trpc/client";
import { useCurrency } from "@/lib/utils";

type Props = {};

const NavBar = (props: Props) => {
  const session = useSession();
  const userId = session.data?.user.id;

  const { data: user } = trpcClient.getUserById.useQuery(userId);
  const balance = useCurrency(user?.myBank.balance);

  return (
    <div className="w-full border-b sticky top-0 items-center flex p-3 justify-between h-10 shadow-lg ">
      <Link href="/">Home</Link>
      <div className="pr-3 flex gap-6">
        <button
          onClick={() =>
            session.status === "authenticated" ? signOut() : signIn()
          }
        >
          {session.status === "authenticated" ? "Sign Out" : "Sign In"}
        </button>
        {user && user.isDispatcher ? (
          <Link href={`/dispatcher/${user.phone}`}>Dispatcher dashboard</Link>
        ) : (
          <Link href="/signup">Become a dispatcher</Link>
        )}
        {user ? (
          <div> Account ₦{balance}</div>
        ) : (
          <Link href="/signup">Sign up</Link>
        )}
      </div>
    </div>
  );
};

export default NavBar;
