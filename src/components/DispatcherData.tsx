import { trpcClient } from "@/trpc/client";
import React from "react";

type Props = {
  dispatcherPhone?: string;
};

const DispatcherData = ({ dispatcherPhone }: Props) => {
  if (!dispatcherPhone) return null;
  const { data: dispatcher } =
    trpcClient.getDispatcherByPhone.useQuery(dispatcherPhone);

  if (!dispatcher) return null;

  return (
    <div className="text-left p-5 rounded-md border">
      Dispatcher
      <div className=" mt-4 flex gap-4">
        <div className="w-14 h-14">
          <img src={dispatcher.image ? dispatcher.image : "/avatar.png"} />
        </div>
        <div className="flex-grow flex flex-col">
          {dispatcher.name && (
            <div>
              <span className="font-bold">Name:</span>
              {dispatcher.name}
            </div>
          )}

          <div>
            <span
              className={`w-2 h-2 rounded-full ${
                dispatcher.isOnline ? "bg-green-600" : "bg-red-600"
              }`}
            ></span>
            {dispatcher.isOnline ? "Online" : "Offline"}{" "}
            <span className="text-gray-400">
              Last seen:{" "}
              {new Intl.DateTimeFormat("en-GB", {
                timeStyle: "short",
                dateStyle: "short",

                hour12: true,
              }).format(dispatcher.lastSeen)}{" "}
            </span>
          </div>

          <div>
            <span className="font-bold">Phone: </span>
            {dispatcher.phone}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherData;
