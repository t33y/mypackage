import type { UserDelivery } from "@/app/page";
import { trpcClient } from "@/trpc/client";
import Link from "next/link";
import React, { useEffect } from "react";

type Props = {
  userDeliveries: UserDelivery[];
  userDeliveryIds: string[];
  setUserDeliveries: React.Dispatch<React.SetStateAction<UserDelivery[]>>;
  handleDeleteDelivery: (delivery: UserDelivery) => void;
};

const UserDeliveries = ({
  userDeliveries,
  userDeliveryIds,
  handleDeleteDelivery,
  setUserDeliveries,
}: Props) => {
  const { data } = trpcClient.getDeliveriesStatuses.useQuery(userDeliveryIds);
  console.log("data not in useeffect", data);
  useEffect(() => {
    // if (typeof window === "undefined") return;
    console.log("response from data", data);
    // if (!data) return;
    setUserDeliveries((prev) => {
      return prev.filter((delivery) => {
        const match = data?.find((d) => {
          console.log("ended", d);
          console.log("deliveries", delivery);
          return delivery?.id === d._id;
        });
        console.log("match", match);
        if (!match?.isEnded) return delivery;
      });
      //   if (deliveryNotEnded.length < 1) {
      //     return [];
      //   } else return deliveryNotEnded;
    });
  }, [data]);

  return (
    <div className="mb-32 grid mt-6 text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
      {userDeliveries.map((userDelivery) => {
        if (!userDelivery) return;
        return (
          <div className="border p-3 rounded-md " key={userDelivery.id}>
            <Link href={`http://localhost:3000/delivery/${userDelivery.id}`}>
              From <div>{userDelivery.originAddress}</div> To{" "}
              <div>{userDelivery.destinationAddress}</div>
            </Link>
            <button
              onClick={() => {
                handleDeleteDelivery(userDelivery);
              }}
              className="border p-2 flex justify-center my-2 rounded-md"
            >
              delete delivery
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default UserDeliveries;
