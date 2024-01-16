"use client";
import { trpcClient } from "@/trpc/client";
import { signIn, useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type Props = {};

const SignUp = ({}: Props) => {
  const session = useSession();
  const [isDispatcher, setIsDispatcher] = useState(false);
  console.log("session", session);
  const router = useRouter();
  const searchParams = useSearchParams();
  const delivery = searchParams.get("delivery");
  const dispatcher = searchParams.get("dispatcher");
  const { mutate } = trpcClient.signUp.useMutation();
  const { mutate: deleteData } = trpcClient.deleteDelivery.useMutation();
  if (dispatcher) {
    setIsDispatcher(true);
  }
  console.log("logging is dispatcher", isDispatcher);

  const handleCancelClick = () => {
    if (delivery) {
      deleteData({ id: delivery });
    }
    router.push("/");
  };

  const handleSignUpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    console.log("form 1 ", form);

    let formObj: Record<string, FormDataEntryValue | null> = {};
    for (let key of Array.from(formData.keys())) {
      formObj[key] = formData.get(key);
    }
    if (!formObj.password) return alert("Please enter password");
    console.log("form data", formObj);
    mutate(
      { ...formObj, isDispatcher },
      {
        onSuccess: async (data) => {
          // let form = e.target as HTMLFormElement
          console.log("form", form);
          form.reset();
          data === "Credentials already exist"
            ? await signIn()
            : router.push("..");
        },
      }
    );
  };
  const handleSignInButtonClick = async () => {
    await signIn();
    if (delivery) {
      router.push(`/delivery/${delivery}`);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-between p-24">
      <form
        className="flex gap-4 h-screen flex-col justify-center "
        onSubmit={handleSignUpSubmit}
      >
        <div className="space-x-3">
          <label htmlFor="name">Name</label>
          <input
            className="text-black"
            type="text"
            name="name"
            readOnly={!!session.data?.user.name}
            value={session.data?.user.name ? session.data.user.name : ""}
            id="name"
            placeholder="John Doe"
          />
        </div>
        <div className="space-x-3">
          <label htmlFor="email">Email</label>
          <input
            className="text-black"
            type="email"
            name="email"
            readOnly={!!session.data?.user.email}
            value={session.data?.user.email ? session.data.user.email : ""}
            required={!isDispatcher}
            id="email"
            placeholder="johndoe@example.com"
          />
        </div>
        {!dispatcher && (
          <div className="space-x-3">
            <label htmlFor="isDispatcher">Are you a Dispatcher</label>
            <input
              type="checkbox"
              required
              id="isDispatcher"
              onChange={(e) => {
                console.log("check value", e.target.value);
                e.target.value === "on"
                  ? setIsDispatcher(true)
                  : setIsDispatcher(false);
                console.log("dispatcher checking", isDispatcher);
              }}
            />
          </div>
        )}
        <div className="space-x-3">
          <label htmlFor="phone">Phone number</label>
          <input
            className="text-black"
            type="tel"
            name="phone"
            required={isDispatcher}
            id="phone"
          />
        </div>
        <div className="space-x-3">
          <label htmlFor="password">Password</label>
          <input
            className="text-black"
            name="password"
            type="password"
            required
            id="password"
          />
        </div>
        <div className="flex mt-4 gap-3">
          <button className="p-3 border rounded-md" type="submit">
            Submit
          </button>
          <button
            className=" p-3 border rounded-md"
            type="button"
            onClick={handleCancelClick}
          >
            Cancel
          </button>
        </div>
      </form>
      <div className="w-full items-center p-6 text-left gap-2 flex flex-col">
        Already have an account? Or Sign in with Google
        <button
          onClick={handleSignInButtonClick}
          className="w-[40%] p-3 text-center rounded-md border"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default SignUp;
