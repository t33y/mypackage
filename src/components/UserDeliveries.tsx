import type { UserDelivery } from "@/app/page";

import Link from "next/link";
import React, { useState } from "react";
import { deliverySchema } from "../lib/schemas";
import { z } from "zod";

type delivery = z.infer<typeof deliverySchema>;
type Props = {
  userDeliveries?: delivery[];
  isActive?: boolean;
  handleDeleteDelivery: (deliveryId: string) => void;
};

const UserDeliveries = ({
  userDeliveries,
  isActive = true,
  handleDeleteDelivery,
}: Props) => {
  if (!userDeliveries) return null;

  if (isActive) {
    const deliveries = userDeliveries.filter((delivery) => {
      return delivery.isActivated;
    });

    userDeliveries = deliveries.length ? deliveries : [];
  }

  return (
    <div className="mb-32 gap-3 grid mt-6 text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
      <div className="text-xl col-span-4 py-6 font-bold text-left">
        {isActive && "Active"} Deliveries
      </div>
      {userDeliveries.length > 0 ? (
        userDeliveries.map((userDelivery) => {
          if (!userDelivery) return;
          return (
            <Link
              href={`http://localhost:3000/delivery/${userDelivery._id}`}
              className="border p-3 rounded-md "
              key={userDelivery._id}
            >
              <div>
                From <div>{userDelivery.pickupAddress}</div> To{" "}
                <div>{userDelivery.destinationAddress}</div>
              </div>
              {userDelivery.isStarted ? (
                <div className="text-green-500">
                  Dispatcher has started the delivery
                </div>
              ) : (
                <div className="text-red-500">
                  Dispatcher has not started the delivery
                </div>
              )}
              <button
                onClick={() => {
                  handleDeleteDelivery(userDelivery._id);
                }}
                className="border p-2 flex justify-center my-2 rounded-md"
              >
                delete delivery
              </button>
            </Link>
          );
        })
      ) : (
        <div> You have no {isActive && "Active"} Deliveries </div>
      )}
    </div>
  );
};

export default UserDeliveries;
