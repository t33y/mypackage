"use client";
import MapComponent from "@/components/MapComponent";
import { trpcClient } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Props = {
  params: {
    tracker: string;
  };
};

export default function Track({ params: { tracker } }: Props) {
  const [isDispatcher, setIsDispatcher] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const dispatcherCodeRef = useRef<HTMLInputElement | null>(null);
  const { data } = trpcClient.confirmDispatcherCode.useQuery({
    code: dispatcherCodeRef?.current?.value,
    trackingId: tracker,
  });
  const router = useRouter();

  const confirmDispatcher = () => {
    setIsLoading(true);

    if (!dispatcherCodeRef.current) {
      setIsLoading(false);
      alert("Please Enter Dispatcher Code");
      return;
    }

    console.log("data tracking ", data);
    if (data) {
      setIsLoading(false);
      router.push(`http://localhost:3000/track/${tracker}/dispatcher`);
    } else {
      alert("Dispatcher code not correct");
      return;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <button
          className="border p-2 flex justify-center my-2 rounded-md"
          onClick={() => setIsDispatcher((prev) => !prev)}
        >
          Dispatcher
        </button>
        <button
          className="border p-2 flex justify-center my-2 rounded-md"
          onClick={() =>
            router.push(`http://localhost:3000/track/${tracker}/tracking`)
          }
        >
          Receiver
        </button>
      </div>
      {isDispatcher && (
        <div className="flex gap-2 place-items-center">
          Enter dispatcher code:
          <input className="text-black " ref={dispatcherCodeRef} type="text" />
          <button
            className="border p-2 flex justify-center m-2 rounded-md"
            onClick={confirmDispatcher}
          >
            Submit
          </button>
        </div>
      )}
    </main>
  );
}
